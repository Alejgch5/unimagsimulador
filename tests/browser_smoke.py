#!/usr/bin/env python3
"""Exercise the real static UI in Chromium. Start the repository HTTP server first.

Requires Playwright Python and system Chromium. No simulation state is mutated by
this test: all clinical decisions use visible controls, and readSimulation() is
used only to assert outcomes. Screenshots and downloaded records use /tmp.
"""
import argparse
import json
import tempfile
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright, expect

PREPARATION = [
    ['identify', 'indication', 'explain', 'consent', 'allergies', 'assess_risk'],
    ['privacy', 'position', 'preclean'],
    ['hand_hygiene'],
    ['check_equipment', 'choose_device'],
    ['sterile_gloves', 'drape'],
    ['clean', 'wait_dry'],
    ['lubricant', 'closed_system'],
]


def run(base_url):
    base_url = base_url.rstrip('/') + '/'
    expected_host = urlsplit(base_url).netloc
    errors, external, failed_http = [], [], []
    results = []

    def passed(message):
        results.append(message)
        print('PASS:', message, flush=True)

    with sync_playwright() as p, tempfile.TemporaryDirectory(prefix='vesica-browser-') as temp:
        browser = p.chromium.launch(
            executable_path='/usr/bin/chromium', headless=True,
            args=['--enable-unsafe-swiftshader'],
        )
        context = browser.new_context(viewport={'width': 1440, 'height': 1080}, accept_downloads=True, reduced_motion='reduce')
        context.on('page', lambda page: page.on('pageerror', lambda error: errors.append(str(error))))
        context.on('request', lambda req: external.append(req.url)
                   if req.url.startswith(('http://', 'https://')) and urlsplit(req.url).netloc != expected_host else None)
        context.on('response', lambda res: failed_http.append((res.status, res.url)) if res.status >= 400 else None)
        page = context.new_page()
        page.set_default_timeout(10000)
        page.goto(base_url, wait_until='domcontentloaded')
        expect(page.locator('#start-dialog')).to_be_visible()
        expect(page.locator('#voice-toggle')).to_have_attribute('aria-pressed', 'true')
        expect(page.locator('#scene-3d canvas')).to_have_count(1)
        assert not errors, errors
        passed('Initial case dialog, voice enabled by default, local WebGL canvas, no JavaScript errors')

        def state():
            return page.evaluate("async () => (await import('./app.js')).readSimulation()")

        def action(name):
            target = page.locator(f'[data-action="{name}"]')
            try:
                expect(target).to_be_visible()
                expect(target).to_be_enabled()
                target.click()
                if name == 'identify':
                    expect(page.locator(':focus')).to_have_attribute('data-action', 'identify')
            except Exception as exc:
                snapshot = state()
                raise AssertionError(f'Action {name!r} unavailable at stage {snapshot["stage"]}; available={snapshot["actions"]}') from exc

        def start():
            page.locator('#start-session').click()
            expect(page.locator('#start-dialog')).not_to_be_visible()

        def select_case(case_id):
            page.locator('#case-select').select_option(case_id)
            if page.locator('#confirm-dialog').is_visible():
                page.locator('#confirm-restart').click()
            expect(page.locator('#start-dialog')).to_be_visible()
            assert state()['caseId'] == case_id
            start()

        def prepare():
            for stage, actions in enumerate(PREPARATION):
                assert state()['stage'] == stage
                for name in actions:
                    action(name)
                expect(page.locator('#next-step')).to_be_enabled()
                page.locator('#next-step').click()
                assert state()['stage'] == stage + 1

        def advance_to(value):
            slider = page.locator('#insertion-target')
            expect(slider).to_be_visible()
            slider.focus()
            slider.press('Home')
            if value == 100:
                slider.press('End')
            else:
                for _ in range(value // 5):
                    slider.press('ArrowRight')

        def finish_correct(case_id):
            prepare()
            advance_to(100)
            assert state()['insertion'] == 100
            page.locator('#next-step').click()
            for name in ['observe_urine', 'verify_position', 'confirm']:
                action(name)
            page.locator('#next-step').click()
            action('check_balloon_spec')
            action('inflate')
            page.locator('#next-step').click()
            for name in ['secure', 'bag_below', 'check_flow']:
                action(name)
            if case_id != 'female':
                action('foreskin')
            page.locator('#next-step').click()
            page.wait_for_function("async () => (await import('./app.js')).readSimulation().drainage > 0")
            for name in ['remove_gloves', 'final_hygiene', 'document', 'reassess', 'finish']:
                action(name)
            result = state()
            assert result['finished'] and result['outcome'] == 'completed', result
            assert result['score'] == 100 and not result['criticalFailure'], result['debrief']
            assert not result['errors'] and len(result['completed']) == 12, result['debrief']
            expect(page.locator('#panel-debrief')).to_be_visible()
            expect(page.locator('#debrief-content')).to_contain_text('Procedimiento completado')
            assert result['drainage'] > 0
            return result

        start()
        page.locator('[data-layer="surface"]').click()
        expect(page.locator('[data-layer="surface"]')).to_have_attribute('aria-pressed', 'true')
        page.locator('[data-layer="anatomy"]').click()
        for view in ['front', 'detail', 'oblique']:
            page.locator(f'[data-view="{view}"]').click()
        page.locator('.anatomy-label').filter(has_text='Vejiga').click()
        expect(page.locator('#structure-info')).to_be_visible()
        expect(page.locator('#structure-title')).to_have_text('Vejiga')
        page.locator('#structure-close').click()
        passed('Surface/anatomy layers, three camera views, selectable bladder anatomy')

        page.locator('#pause-session').click()
        assert state()['paused']
        frozen = state()['elapsed']
        page.wait_for_timeout(400)
        assert state()['elapsed'] == frozen
        page.locator('#pause-session').click()
        page.wait_for_timeout(400)
        assert state()['elapsed'] > frozen
        passed('Pause freezes the clinical clock and resume restarts it')

        male = finish_correct('male')
        passed('Male: all 12 stages, full safe sequence, drainage and 100/100 debrief')
        page.locator('#tab-log').click()
        expect(page.locator('#clinical-log li')).not_to_have_count(0)
        with page.expect_download() as download_info:
            page.locator('#export-log').click()
        download = download_info.value
        destination = Path(temp) / download.suggested_filename
        download.save_as(destination)
        record = json.loads(destination.read_text())
        assert record['caseId'] == 'male' and record['finished'] and record['score'] == 100
        assert record['log'] and 'validación' in record['limitations']
        passed('Clinical history and downloadable JSON preserve the actual completed attempt')

        select_case('female')
        female = finish_correct('female')
        assert female['case']['sex'] == 'female'
        passed('Female: all 12 stages including latex-safe equipment selection and safe completion')

        select_case('female')
        prepare()
        action('wrong_site')
        misplaced = state()
        assert misplaced['placement'] == 'vaginal' and misplaced['event']['id'] == 'vaginal_misplacement'
        assert not misplaced['injury'] and misplaced['drainage'] == 0
        expect(page.locator('.anatomy-placement-note')).to_be_visible()
        for name in ['stop', 'assess', 'new_sterile_catheter', 'resume']:
            action(name)
        corrected = state()
        assert corrected['placement'] == 'urethral' and corrected['insertion'] == 0 and corrected['event'] is None
        expect(page.locator('.anatomy-placement-note')).not_to_be_visible()
        passed('Female misplaced catheter: distinct 3D vaginal route, no urine, sterile replacement before resuming')

        select_case('trauma')
        for name in ['identify', 'explain', 'assess_risk', 'defer', 'assess', 'call_help']:
            action(name)
        trauma = state()
        assert trauma['finished'] and trauma['outcome'] == 'safe_referral'
        assert trauma['insertion'] == 0 and not trauma['criticalFailure']
        assert trauma['debrief']['passed']
        passed('Trauma: risk recognition, no instrumentation, assessment and safe referral')

        select_case('difficult')
        prepare()
        advance_to(100)
        assert state()['insertion'] == 55 and state()['event']['id'] == 'resistance'
        action('force')
        injury = state()
        assert injury['criticalFailure'] and injury['bleeding'] and injury['injury'] == 'forced_resistance'
        assert injury['dialogue']
        for name in ['stop', 'assess', 'call_help']:
            action(name)
        injury = state()
        assert injury['finished'] and injury['outcome'] == 'injury_referral'
        assert injury['criticalFailure'] and injury['debrief']['critical']
        expect(page.locator('#debrief-content')).to_contain_text('Fallo crítico')
        passed('Difficult case: resistance, forced insertion injury, patient complaint and critical referral')

        select_case('male')
        action('identify')
        page.locator('#reset-session').click()
        expect(page.locator('#confirm-dialog')).to_be_visible()
        page.locator('#confirm-cancel').click()
        assert state()['flags'].get('identified') is True
        page.locator('#reset-session').click()
        page.locator('#confirm-restart').click()
        expect(page.locator('#start-dialog')).to_be_visible()
        assert not state()['flags'].get('identified') and state()['stage'] == 0
        start()
        passed('Restart dialog can preserve an attempt or reset all clinical state')

        prepare()
        advance_to(40)
        assert state()['insertion'] == 40
        action('premature_balloon')
        assert state()['injury'] == 'urethral_balloon' and state()['balloon'] > 0
        for name in ['stop', 'assess', 'call_help']:
            action(name)
        assert not state()['finished']
        action('deflate')
        balloon = state()
        assert balloon['finished'] and balloon['balloon'] == 0 and balloon['criticalFailure']
        expect(page.locator('#debrief-content')).to_contain_text('Fallo crítico')
        passed('Premature balloon inflation: injury and mandatory deflation before critical case closure')

        page.screenshot(path='/tmp/vesica-desktop-smoke.png', full_page=True)
        mobile = context.new_page()
        mobile.set_viewport_size({'width': 390, 'height': 844})
        mobile.goto(base_url, wait_until='domcontentloaded')
        expect(mobile.locator('#start-dialog')).to_be_visible()
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile start dialog overflows horizontally'
        mobile.locator('#start-session').click()
        expect(mobile.locator('#scene-3d canvas')).to_have_count(1)
        mobile.wait_for_timeout(350)
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile workflow overflows horizontally'
        mobile.locator('[data-action="identify"]').click()
        mobile_snapshot = mobile.evaluate("async () => (await import('./app.js')).readSimulation()")
        assert mobile_snapshot['flags'].get('identified')
        mobile.screenshot(path='/tmp/vesica-mobile-smoke.png', full_page=True)
        passed('390px mobile layout: no horizontal overflow, working clinical action and 3D canvas')
        assert not external, f'Unexpected external asset requests: {external}'
        assert not failed_http, f'Failed asset requests: {failed_http}'
        assert not errors, f'JavaScript page errors: {errors}'
        passed('All assets local, no HTTP failures and no JavaScript errors throughout the tested workflows')
        context.close()
        browser.close()
    print(f'Browser smoke: {len(results)} checks passed.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:8000/')
    run(parser.parse_args().url)

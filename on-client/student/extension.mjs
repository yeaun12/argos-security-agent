// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('div');
      const deviceStatusLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionStatusLabels = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };
      const modeLabels = {
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      const addText = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.append(node);
        return node;
      };
      const statusLabel = (labels, value) => `${labels[value] || '확인 불가'}(${value})`;

      const addResource = (name, resource, renderData) => {
        const group = document.createElement('section');
        addText(group, 'h3', name);

        const modeLabel = modeLabels[resource?.mode] || (resource?.mode === 'connected' ? '' : '확인 불가');
        if (modeLabel) addText(group, 'p', modeLabel);

        if (resource?.status === 'loading') {
          addText(group, 'p', '불러오는 중');
        } else if (resource?.status === 'error') {
          const code = resource.error?.code;
          const failureLabel = ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(code)
            ? '확인 불가'
            : '연결 실패';
          const message = typeof resource.error?.message === 'string' ? resource.error.message : '';
          addText(group, 'p', `${failureLabel}: ${message}`);
        } else if (resource?.status === 'ok') {
          renderData(group, resource.data);
        } else {
          addText(group, 'p', '확인 불가');
        }

        root.append(group);
      };

      addResource('현재 로그인', me, (group, data) => {
        const { user, device, session } = data;
        addText(group, 'p', `사용자: ${user.label} (ID: ${user.id})`);
        addText(group, 'p', `기기: ${device.label} (ID: ${device.id}) · ${statusLabel(deviceStatusLabels, device.status)}`);
        addText(group, 'p', `세션: ${session.id} · ${statusLabel(sessionStatusLabels, session.status)}`);
      });

      addResource('기기', devices, (group, data) => {
        const list = document.createElement('ul');
        for (const device of data) {
          const item = document.createElement('li');
          item.textContent = `${device.label} (ID: ${device.id}) · ${statusLabel(deviceStatusLabels, device.status)}`;
          list.append(item);
        }
        group.append(list);
      });

      addResource('세션', sessions, (group, data) => {
        const list = document.createElement('ul');
        for (const session of data) {
          const item = document.createElement('li');
          item.textContent = `${session.id} · ${statusLabel(sessionStatusLabels, session.status)}`;
          list.append(item);
        }
        group.append(list);
      });

      return root;
    },
    renderDecision({ status = 'idle', mode, data, error, appId } = {}) {
      const root = document.createElement('div');
      const addText = (text) => {
        const node = document.createElement('p');
        node.textContent = text;
        root.append(node);
      };

      if (mode === 'demo') addText('예제 자료(demo) · 실제 업무 앱 접속 성공이 아닙니다.');
      else if (mode === 'disconnected') addText('연결 없음(disconnected)');
      else if (mode === 'unknown') addText('연결 상태 확인 불가(unknown)');

      if (status === 'idle') {
        addText('업무 앱을 골라 접속을 요청하세요.');
        return root;
      }

      if (appId != null) addText(`요청한 앱 ID: ${appId}`);

      if (status === 'loading') {
        addText('판정 확인 중');
        return root;
      }

      if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message
          ? error.message : '서버 오류 메시지를 확인할 수 없습니다.';
        addText(`요청 실패: ${message}`);
        addText('요청 실패는 접근 거부(deny) 판정이 아닙니다.');
        return root;
      }

      if (status !== 'ok' || data == null || typeof data !== 'object') {
        addText('접속 판정: 확인 불가(unknown)');
        addText('접근 허용으로 간주하지 않습니다.');
        return root;
      }

      if (appId == null && data.appId != null) addText(`요청한 앱 ID: ${data.appId}`);

      const decisionLabels = {
        allow: '접근 허용(allow)',
        deny: '접근 거부(deny)',
        challenge: '추가 확인 필요(challenge)',
        unknown: '확인 불가(unknown)',
      };
      const decision = Object.hasOwn(decisionLabels, data.decision) ? data.decision : 'unknown';
      addText(`접속 판정: ${decisionLabels[decision]}`);

      if (decision === 'allow') {
        addText('정책상 접근 허용이며 실제 업무 앱 접속 성공을 보장하지 않습니다.');
      } else if (decision === 'deny') {
        addText('정책상 접근 거부 판정입니다.');
      } else if (decision === 'challenge') {
        addText('추가 인증 또는 확인이 필요합니다. 이 앱은 확인 절차를 대신 수행하지 않습니다.');
      } else {
        addText('판정 확인 불가: 접근 허용으로 간주하지 않습니다.');
      }

      const reason = typeof data.reason === 'string' && data.reason.trim()
        ? data.reason : '사유 정보 없음';
      const checkedAt = typeof data.checkedAt === 'string' && data.checkedAt
        ? data.checkedAt : '판정 시각 정보 없음';
      addText(`판정 이유: ${reason}`);
      addText(`판정 시각: ${checkedAt}`);
      return root;
    },
    renderEvents({ status = 'loading', mode, data, error } = {}) {
      const root = document.createElement('div');
      const addText = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.append(node);
        return node;
      };
      if (mode === 'demo') addText(root, 'p', '예제 자료(demo) · 실제 보안 기록이 아닙니다.');
      else if (mode === 'disconnected') addText(root, 'p', '연결 없음(disconnected)');
      else if (mode === 'unknown') addText(root, 'p', '연결 상태 확인 불가(unknown)');

      if (status === 'loading') {
        addText(root, 'p', '기록을 불러오는 중');
        return root;
      }
      if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message
          ? error.message : '서버 오류 메시지를 확인할 수 없습니다.';
        const label = error?.code === 'CONTRACT_MISMATCH'
          ? '확인 불가: 기록을 불러오지 못했습니다'
          : '기록을 불러오지 못했습니다';
        addText(root, 'p', `${label}: ${message}`);
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        addText(root, 'p', '확인 불가: 기록 상태를 확인할 수 없습니다.');
        return root;
      }
      if (data.length === 0) {
        addText(root, 'p', '표시할 기록이 없습니다.');
        return root;
      }

      addText(root, 'p', '제공받은 본인 최근 기록(최대 40건)만 표시합니다. 전체 감사 로그나 실시간 위협 탐지 결과가 아닙니다.');
      addText(root, 'p', '정렬 기준: 사건 발생 시각(event.at) 최신순(UTC). 조회 확인 시각은 학생 기록 입력에 전달되지 않아 확인 불가이며, 사건 시각을 조회 시각이라고 표시하지 않습니다.');
      const sorted = data
        .map((event, index) => ({ event, index }))
        .sort((a, b) =>
          (Date.parse(b.event.at) - Date.parse(a.event.at)) ||
          (a.index - b.index))
        .map(({ event }) => event);
      const filters = document.createElement('div');
      root.append(filters);
      const optionsFrom = (values) => ['all', ...new Set(values.filter(v => typeof v === 'string' && v !== ''))];
      const createFilter = (name, values, describe) => {
        const label = document.createElement('label');
        label.textContent = `${name}: `;
        const select = document.createElement('select');
        select.setAttribute('aria-label', name);
        for (const value of optionsFrom(values)) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value === 'all' ? '전체' : describe(value);
          select.append(option);
        }
        select.value = 'all';
        label.append(select);
        filters.append(label);
        return select;
      };
      const kindNames = { access: '접속', xdr: 'XDR 경보' };
      const accessNames = { allowed: '접근 허용', denied: '접근 거부', unknown: '확인 불가' };
      const sessionNames = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const deviceNames = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
      const displayStatus = (labels, value) => `${labels[value] || '확인 불가'}(${value ?? 'unknown'})`;
      const kindFilter = createFilter('기록 종류', sorted.map(e => e.kind), v => `${kindNames[v] || '확인 불가'}(${v})`);
      const appFilter = createFilter('업무 앱', sorted.map(e => e.appId), v => v);
      const accessFilter = createFilter('접속 상태', sorted.map(e => e.state.access), v => displayStatus(accessNames, v));
      // Local filter only; never sends search text to the app server.
      const searchLabel = document.createElement('label');
      searchLabel.textContent = '현재 받은 기록에서 검색: ';
      const search = document.createElement('input');
      search.type = 'search';
      search.setAttribute('aria-label', '현재 받은 기록에서 검색');
      search.setAttribute('placeholder', '사건 ID · 요약 · 앱 ID');
      search.setAttribute('autocomplete', 'off');
      searchLabel.append(search);
      filters.append(searchLabel);
      addText(root, 'p', '검색·필터는 현재 전달된 본인 기록 안에서만 적용됩니다. 전체 서버 로그를 검색하지 않습니다.');
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.textContent = '필터 초기화';
      resetButton.setAttribute('data-argos-filter-reset', 'true');
      filters.append(resetButton);

      const count = addText(root, 'p', '');
      const statusSummary = addText(root, 'p', '');
      statusSummary.setAttribute('data-argos-status-summary', 'true');
      const workspace = document.createElement('section');
      workspace.className = 'argos-v11-workspace';
      workspace.setAttribute('data-argos-v11-workspace', 'true');
      const timeline = document.createElement('div');
      timeline.className = 'argos-v11-timeline';
      const list = document.createElement('ul');
      timeline.append(list);
      const investigation = document.createElement('aside');
      investigation.className = 'argos-v11-investigation';
      investigation.setAttribute('aria-label', '선택한 사건의 조사 가이드');
      workspace.append(timeline, investigation);
      root.append(workspace);
      let selectedId = null;

      const addRows = (parent, title, rows) => {
        addText(parent, 'h5', title);
        if (!rows.length) {
          addText(parent, 'p', '없음');
          return;
        }
        const items = document.createElement('ul');
        for (const row of rows) addText(items, 'li', `${row.id}: ${row.text}`);
        parent.append(items);
      };
      const renderList = (focusId = null) => {
        const visible = sorted.filter(event =>
          (kindFilter.value === 'all' || event.kind === kindFilter.value)
          && (appFilter.value === 'all' || event.appId === appFilter.value)
          && (accessFilter.value === 'all' || event.state.access === accessFilter.value)
          && [event.id, event.summary, event.appId].some(value =>
            String(value ?? '').toLocaleLowerCase('ko-KR').includes(search.value.trim().toLocaleLowerCase('ko-KR'))));
        if (!visible.some(event => event.id === selectedId)) selectedId = null;
        count.textContent = `표시 ${visible.length}건 / 받은 기록 ${sorted.length}건`;
        const allowedCount = visible.filter(
          event => event.state.access === 'allowed').length;
        const deniedCount = visible.filter(
          event => event.state.access === 'denied').length;
        const unknownCount = visible.length - allowedCount - deniedCount;

        statusSummary.textContent =
          '현재 표시 기록 · 허용 ' + allowedCount +
          '건 / 거부 ' + deniedCount +
          '건 / 확인 불가 ' + unknownCount + '건';

        // This pane mirrors the selected source event; it does not infer severity.
        investigation.replaceChildren();
        const selectedEvent = visible.find(event => event.id === selectedId);
        if (!selectedEvent) {
          addText(investigation, 'h4', '사건 조사 가이드');
          addText(investigation, 'p', '왼쪽 기록의 「상세」를 선택하면 조사 순서가 나타납니다.');
          addText(investigation, 'p', '01 · 사건 시각·출처 확인 → 02 · 근거와 규칙 검토 → 03 · 필요할 때 AI 설명 요청 → 04 · 사람의 최종 판단');
        } else {
          addText(investigation, 'h4', '선택한 사건 · ' + selectedEvent.id);
          addText(investigation, 'p', '발생 시각: ' + selectedEvent.at);
          addText(investigation, 'p', '원본 자료: ' + (mode === 'demo' ? 'Demo 예제 · 실제 침해 기록 아님' : mode === 'connected' ? '연결된 서비스에서 전달한 본인 기록' : '출처 확인 불가'));
          addText(investigation, 'p', '접속: ' + displayStatus(accessNames, selectedEvent.state.access));
          addText(investigation, 'p', '기기: ' + displayStatus(deviceNames, selectedEvent.state.device));
          addText(investigation, 'p', '세션: ' + displayStatus(sessionNames, selectedEvent.state.session));
          const eCount = Array.isArray(selectedEvent.evidence) ? selectedEvent.evidence.length : 0;
          const rCount = Array.isArray(selectedEvent.rules) ? selectedEvent.rules.length : 0;
          addText(investigation, 'p', '전달된 근거 ' + eCount + '건 · 규칙 ' + rCount + '건');
          addText(investigation, 'h5', '다음 조사 순서');
          addText(investigation, 'p', '01 · 왼쪽 상세에서 근거 ID와 규칙을 확인합니다.');
          addText(investigation, 'p', '02 · 필요하면 제공 기록 카드의 「AI 설명 요청」을 사용합니다. AI 결과는 참고 정보입니다.');
          addText(investigation, 'p', '03 · 상태가 확인 불가라면 정상으로 간주하지 말고 원천 자료를 다시 확인합니다.');
          addText(investigation, 'p', '04 · AI 제안과 원천 근거를 검토한 뒤 최종 판단은 사람이 수행합니다.');
          addText(investigation, 'p', '보안 조치 실행은 이 패널에서 지원하지 않습니다.');
        }
        list.replaceChildren();
        if (visible.length === 0) addText(list, 'li', '선택한 조건에 맞는 기록이 없습니다.');
        let focusButton = null;
        let lastUtcDay = null;
        for (const event of visible) {
          const eventTime = Date.parse(event.at);
          const utcDay = Number.isFinite(eventTime) ? new Date(eventTime).toISOString().slice(0, 10) : '시각 확인 불가';
          if (utcDay !== lastUtcDay) {
            const dateGroup = document.createElement('li');
            dateGroup.setAttribute('data-student-date-group', utcDay);
            dateGroup.textContent = `사건 발생일(UTC): ${utcDay}`;
            list.append(dateGroup);
            lastUtcDay = utcDay;
          }
          const item = document.createElement('li');
          item.setAttribute('data-student-event-id', event.id);
          addText(item, 'p', `사건 ID: ${event.id} · 시각: ${event.at} · 종류: ${kindNames[event.kind] || '확인 불가'}(${event.kind}) · 앱: ${event.appId ?? '앱을 확인할 수 없음'}`);
          addText(item, 'p', `요약: ${event.summary}`);
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = `${event.id} 상세`;
          button.setAttribute('aria-expanded', String(selectedId === event.id));
          button.addEventListener('click', () => {
            selectedId = selectedId === event.id ? null : event.id;
            renderList(event.id);
          });
          item.append(button);
          if (event.id === focusId) focusButton = button;
          if (selectedId === event.id) {
            const detail = document.createElement('div');
            detail.setAttribute('data-student-event-detail', event.id);
            addText(detail, 'h4', `사건 ${event.id} 상세`);
            addText(detail, 'p', `앱 ID: ${event.appId ?? '앱을 확인할 수 없음'}`);
            addRows(detail, '근거(evidence)', event.evidence);
            addRows(detail, '규칙(rules)', event.rules);
            addText(detail, 'p', `접속 상태: ${displayStatus(accessNames, event.state.access)}`);
            addText(detail, 'p', `세션 상태: ${displayStatus(sessionNames, event.state.session)}`);
            addText(detail, 'p', `기기 상태: ${displayStatus(deviceNames, event.state.device)}`);
            if (Array.isArray(event.supportedActions) && event.supportedActions.length > 0) {
              addText(detail, 'p', '조치 실행 연결은 준비 중입니다. 아직 지원하지 않으며 요청을 전송하지 않습니다.');
              for (const action of event.supportedActions) {
                const disabledButton = document.createElement('button');
                disabledButton.type = 'button';
                disabledButton.disabled = true;
                disabledButton.textContent = `${action} 미지원`;
                detail.append(disabledButton);
              }
            }
            item.append(detail);
          }
          list.append(item);
        }
        if (focusButton) focusButton.focus();
      };
      kindFilter.addEventListener('change', () => renderList());
      appFilter.addEventListener('change', () => renderList());
      accessFilter.addEventListener('change', () => renderList());
      search.addEventListener('input', () => renderList());

      resetButton.addEventListener('click', () => {
        kindFilter.value = 'all';
        appFilter.value = 'all';
        accessFilter.value = 'all';
        search.value = '';
        renderList();
      });
      renderList();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('div');
      const addText = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.append(node);
        return node;
      };
      const deviceLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionLabels = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };
      const statusText = (labels, value) =>
        `${Object.hasOwn(labels, value) ? labels[value] : '확인 불가'}(${value ?? 'unknown'})`;
      const visibleMessage = (error) => typeof error?.message === 'string' && error.message
        ? error.message : '서버 오류 메시지를 확인할 수 없습니다.';
      const retryAdvice = '다시 시도는 위쪽 「다시 불러오기」 버튼을 직접 누르세요. 자동으로 재요청하지 않습니다.';

      if (mode === 'demo') addText(root, 'p', '예제 자료(demo) · 실제 연결 상태가 아닙니다.');
      else if (mode === 'disconnected') addText(root, 'p', '연결 없음(disconnected)');
      else if (mode === 'unknown') addText(root, 'p', '연결 상태 확인 불가(unknown)');
      addText(root, 'p', '자료별 상태를 분리해 표시합니다. 연결 없음·확인 불가는 보안 정상 판정이 아닙니다.');

      // B patch: summarize only the received resource snapshots.
      // Unknown, disconnected and demo data are not security assurances.
      const summary = document.createElement('section');
      summary.setAttribute('data-argos-protection-summary', 'true');
      addText(summary, 'h3', '보호 현황 요약');

      const countBy = (items, key) =>
        items.filter(item => item?.status === key).length;

      const isVerifiedCollection = resource =>
        resource?.status === 'ok' &&
        resource?.mode === 'connected' &&
        mode !== 'demo' &&
        mode !== 'disconnected' &&
        mode !== 'unknown' &&
        Array.isArray(resource.data);

      if (isVerifiedCollection(devices)) {
        const rows = devices.data;
        addText(summary, 'p',
          '등록 기기 ' + rows.length +
          '대 · 기준 충족 ' + countBy(rows, 'compliant') +
          ' · 미충족 ' + countBy(rows, 'noncompliant') +
          ' · 확인 불가 ' +
          (rows.length - countBy(rows, 'compliant') -
           countBy(rows, 'noncompliant')));

        if (rows.some(item => item?.status === 'noncompliant')) {
          addText(summary, 'p', '주의: 보안 기준 미충족 기기를 확인하세요.');
        }
      } else {
        addText(summary, 'p',
          '기기 현황 확인 불가 · 실제 기기 상태를 확인하지 못했습니다.');
      }

      if (isVerifiedCollection(sessions)) {
        const rows = sessions.data;
        const active = countBy(rows, 'active');
        const expired = countBy(rows, 'expired');
        const revoked = countBy(rows, 'revoked');

        addText(summary, 'p',
          '세션 ' + rows.length +
          '개 · 활성 ' + active +
          ' · 만료 ' + expired +
          ' · 철회 ' + revoked +
          ' · 확인 불가 ' +
          (rows.length - active - expired - revoked));

        if (expired + revoked > 0) {
          addText(summary, 'p',
            '주의: 만료 또는 철회된 세션이 포함되어 있습니다.');
        }
      } else {
        addText(summary, 'p',
          '세션 현황 확인 불가 · 실제 연결 상태를 확인하지 못했습니다.');
      }

      if (mode === 'demo') {
        addText(summary, 'p',
          '예제 자료(demo) · 실제 보안 알림 건수가 아닙니다.');
      } else if (Array.isArray(notifications)) {
        addText(summary, 'p',
          '전달받은 주의 알림 ' + notifications.length + '건');
        if (notifications.length > 0) {
          addText(summary, 'p', '주의: 알림의 내용을 확인하세요.');
        } else {
          addText(summary, 'p',
            '알림 0건은 전체 시스템의 안전을 보장하지 않습니다.');
        }
      } else {
        addText(summary, 'p',
          '주의 알림 확인 불가 · 알림이 없다는 뜻이 아닙니다.');
      }

      // ARGOS v1.1: a decision aid built only from supplied, scoped resources.
      // It neither scores threats nor converts missing/demo data into a clean bill of health.
      const triage = document.createElement('section');
      triage.className = 'argos-v11-triage';
      triage.setAttribute('data-argos-v11-overview', 'true');
      addText(triage, 'h3', '보안 상태 · 무엇부터 확인할까요?');
      addText(triage, 'p', '현재 전달된 내 기기·세션·알림만 요약합니다. PC 실측값, XDR 예제 기록과는 별개의 확인 범위입니다.');
      const triageCards = document.createElement('div');
      triageCards.className = 'argos-v11-triage-grid';
      const triageCard = (title, label, next, level) => {
        const card = document.createElement('article');
        card.className = 'argos-v11-triage-card';
        card.setAttribute('data-argos-v11-level', level);
        addText(card, 'h4', title);
        addText(card, 'strong', label);
        addText(card, 'p', next);
        triageCards.append(card);
      };
      const notVerified = (resource) => resource?.status === 'loading'
        ? ['조회 중', '조회가 끝나면 다시 확인하세요.', 'pending']
        : ['확인 불가', '위쪽 「다시 불러오기」로 상태를 확인하세요.', 'unknown'];
      if (!isVerifiedCollection(devices)) {
        triageCard('01 · 내 기기', ...notVerified(devices));
      } else if (devices.data.some(x => x?.status === 'noncompliant')) {
        triageCard('01 · 내 기기', '보안 기준 미충족 포함', '아래 기기 목록에서 해당 기기를 확인하세요.', 'attention');
      } else if (devices.data.some(x => x?.status !== 'compliant')) {
        triageCard('01 · 내 기기', '상태 확인 필요', '확인 불가로 표시된 기기를 확인하세요.', 'unknown');
      } else {
        triageCard('01 · 내 기기', '받은 기기 목록 조회 완료', '기기별 준수 결과를 아래에서 확인하세요. 전체 보안 안전 판정은 아닙니다.', 'observed');
      }
      if (!isVerifiedCollection(sessions)) {
        triageCard('02 · 내 세션', ...notVerified(sessions));
      } else if (sessions.data.some(x => ['expired','revoked'].includes(x?.status))) {
        triageCard('02 · 내 세션', '만료·철회 상태 포함', '아래 세션 목록에서 실제 상태를 확인하세요.', 'attention');
      } else if (sessions.data.some(x => x?.status !== 'active')) {
        triageCard('02 · 내 세션', '상태 확인 필요', '확인 불가로 표시된 세션을 확인하세요.', 'unknown');
      } else {
        triageCard('02 · 내 세션', '받은 세션 목록 조회 완료', '현재 전달된 범위의 세션 상태입니다. 과거 세션 전체가 아닙니다.', 'observed');
      }
      if (mode !== 'connected' || !Array.isArray(notifications)) {
        triageCard('03 · 주의 알림', mode === 'demo' ? '예제 자료' : '확인 불가',
          '실제 연결과 알림 자료를 확인하세요. 알림이 0건이라는 뜻이 아닙니다.', 'unknown');
      } else if (notifications.length > 0) {
        triageCard('03 · 주의 알림', '전달된 알림 ' + notifications.length + '건',
          '아래 알림 내용과 관련 보안 기록을 확인하세요.', 'attention');
      } else {
        triageCard('03 · 주의 알림', '전달된 알림 0건',
          '조회 범위 안에 표시할 알림이 없다는 뜻입니다. 전체 시스템에 대한 안전 판정은 아닙니다.', 'observed');
      }
      triage.append(triageCards);
      root.append(triage, summary);

      const renderCollection = (title, resource, emptyText, description) => {
        const section = document.createElement('section');
        addText(section, 'h3', title);
        if (resource?.mode === 'demo') addText(section, 'p', '예제 자료(demo)');
        else if (resource?.mode === 'disconnected') addText(section, 'p', '연결 없음(disconnected)');
        else if (resource?.mode === 'unknown') addText(section, 'p', '확인 불가(unknown)');

        if (!resource || resource.status === 'loading') {
          addText(section, 'p', `${title}: 불러오는 중`);
        } else if (resource.status === 'error') {
          const unverified = resource.error?.code === 'CONTRACT_MISMATCH';
          addText(section, 'p', `${title}: ${unverified ? '확인 불가' : '불러오지 못했습니다'}: ${visibleMessage(resource.error)}`);
          const errorCode = resource.error?.code;
          if ((typeof errorCode === 'string' && /TIMEOUT|TIMED_OUT/i.test(errorCode))
            || /시간이? 초과|시간 초과|시간을 초과/.test(visibleMessage(resource.error))) {
            addText(section, 'p', `${title}: 시간 초과로 결과를 확인하지 못했습니다.`);
          }
          addText(section, 'p', retryAdvice);
        } else if (resource.status === 'ok' && Array.isArray(resource.data)) {
          if (resource.data.length === 0) {
            addText(section, 'p', emptyText);
          } else {
            const list = document.createElement('ul');
            for (const item of resource.data) addText(list, 'li', description(item));
            section.append(list);
          }
        } else {
          addText(section, 'p', `${title}: 확인 불가(unknown)`);
        }
        root.append(section);
      };

      renderCollection('내 기기', devices, '등록된 기기가 없습니다.',
        item => `${item.label} (ID: ${item.id}) · ${statusText(deviceLabels, item.status)}`);
      addText(root, 'p', '등록 기기는 현재 사용자에게 속한 최대 100개까지만 표시됩니다.');
      renderCollection('내 세션', sessions, '현재 연결이 없습니다.',
        item => `세션 ID: ${item.id} · ${statusText(sessionLabels, item.status)}`);
      addText(root, 'p', '세션 조회는 현재 검증된 연결 한 개만 대상으로 하며, 과거 세션 전체 목록이 아닙니다.');

      const alerts = document.createElement('section');
      addText(alerts, 'h3', '주의 알림');
      if (!Array.isArray(notifications)) {
        addText(alerts, 'p', '주의 알림 자료 확인 불가. 알림이 없다는 뜻이 아닙니다.');
      } else if (notifications.length === 0) {
        addText(alerts, 'p', '표시할 주의 알림 0건입니다. 이것만으로 전체 보안 상태가 안전하다고 판단하지 않습니다.');
      } else {
        const list = document.createElement('ul');
        for (const notice of notifications) {
          const resource = typeof notice?.resource === 'string' ? notice.resource : 'unknown';
          const code = typeof notice?.code === 'string' && /^[A-Za-z0-9_.:-]{1,100}$/.test(notice.code)
            ? notice.code : 'UNVERIFIED';
          const message = typeof notice?.message === 'string' ? notice.message : '알림 내용을 확인할 수 없습니다.';
          addText(list, 'li', `자료: ${resource} · 코드: ${code} · 내용: ${message}`);
        }
        alerts.append(list);
      }
      root.append(alerts);

      const help = document.createElement('section');
      addText(help, 'h3', '도움정보');
      const diagValue = value => typeof value === 'string' && value ? value : '확인 불가';
      let safeDiagnostics = null;
      if (!diagnostics || diagnostics.status === 'idle') {
        addText(help, 'p', '도움정보 조회 전입니다. 제공 화면의 「도움정보 불러오기」를 직접 누르세요.');
      } else if (diagnostics.status === 'loading') {
        addText(help, 'p', '도움정보를 불러오는 중');
      } else if (diagnostics.status === 'error') {
        addText(help, 'p', `도움정보를 불러오지 못했습니다: ${visibleMessage(diagnostics.error)}`);
        if ((typeof diagnostics.error?.code === 'string' && /TIMEOUT|TIMED_OUT/i.test(diagnostics.error.code))
          || /시간이? 초과|시간 초과|시간을 초과/.test(visibleMessage(diagnostics.error))) {
          addText(help, 'p', '도움정보 조회 시간 초과');
        }
        addText(help, 'p', '다시 시도하려면 제공 화면의 「도움정보 불러오기」 버튼을 직접 누르세요.');
      } else if (diagnostics.status === 'ok' && diagnostics.data && typeof diagnostics.data === 'object') {
        const data = diagnostics.data;
        // 명시된 6개 값만 새 객체에 복사한다. 서버 원문이나 다른 하위 필드는 사용하지 않는다.
        safeDiagnostics = {
          requestId: diagValue(data.requestId),
          component: diagValue(data.component),
          version: diagValue(data.version),
          checkedAt: diagValue(data.checkedAt),
          engine: {
            mode: diagValue(data.engine?.mode),
            code: diagValue(data.engine?.code),
          },
        };
        addText(help, 'p', `requestId: ${safeDiagnostics.requestId}`);
        addText(help, 'p', `component: ${safeDiagnostics.component}`);
        addText(help, 'p', `version: ${safeDiagnostics.version}`);
        addText(help, 'p', `checkedAt: ${safeDiagnostics.checkedAt}`);
        addText(help, 'p', `engine.mode: ${safeDiagnostics.engine.mode}`);
        addText(help, 'p', `engine.code: ${safeDiagnostics.engine.code}`);
      } else {
        addText(help, 'p', '도움정보 확인 불가(unknown)');
      }

      addText(help, 'p', '「도움정보 복사」는 문의에 필요한 위 6개 값만 복사합니다. 복사 전 표시 내용을 직접 확인하세요.');
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.textContent = '도움정보 복사';
      copyButton.disabled = safeDiagnostics === null;
      const copyResult = addText(help, 'p', '');
      copyButton.addEventListener('click', async () => {
        if (!safeDiagnostics) return;
        try {
          await navigator.clipboard.writeText(JSON.stringify(safeDiagnostics, null, 2));
          copyResult.textContent = '허용된 도움정보 6개 항목을 클립보드에 복사했습니다.';
        } catch {
          copyResult.textContent = '클립보드 복사에 실패했습니다. 제공 화면에서 도움정보를 확인하세요.';
        }
      });
      help.append(copyButton);
      root.append(help);
      return root;
    },
    renderVulnerabilities({ status = 'idle', mode, data, error } = {}) {
      // 20단계: 전달된 조회 스냅샷만 표시한다. 조회·취소·세대 관리는 제공 UI의 책임이다.
      // 매번 새 DOM을 반환하여 이전 조회의 표·속성이 현재 결과에 남지 않게 한다.
      const root = document.createElement('section');
      const add = (parent, tag, content) => {
        const element = document.createElement(tag);
        element.textContent = content;
        parent.append(element);
        return element;
      };
      const p = text => add(root, 'p', text);
      const safeText = (text, limit = 300) => typeof text === 'string' &&
        text.trim().length > 0 && text.length <= limit &&
        !/[\u0000-\u001f\u007f]/.test(text) &&
        !/(?:\bBearer\s+\S+|\bsk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*KEY-----|private\s*key|password|api[_ -]?key|authorization|비밀번호|토큰)/i.test(text);
      const iso = value => typeof value === 'string' &&
        /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
        Number.isFinite(Date.parse(value));
      const installedVersion = value => typeof value === 'string' && value.length <= 100 &&
        /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(value) &&
        !/(?:^|[.+-])0\d+(?:[.+-]|$)/.test(value.split('+')[0]);
      const packageName = value => typeof value === 'string' && value.length <= 214 &&
        /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(value);
      if (mode === 'demo') p('예제 자료(demo)입니다. 실제 OSV 조회가 확인된 결과가 아닙니다.');
      else if (mode === 'disconnected') p('연결 없음(disconnected): 현재 실제 조회 연결은 확인되지 않았습니다.');
      else if (mode === 'unknown') p('연결 상태 확인 불가(unknown): 결과의 출처를 확정하지 않습니다.');

      if (status === 'idle') {
        p('설치 패키지 취약점 조회 전(idle). 이전 조회 결과를 현재 결과로 보지 않습니다.');
        return root;
      }
      if (status === 'loading') {
        p('설치 패키지 취약점 조회 중(loading). 아직 현재 조회 결과가 없습니다.');
        return root;
      }
      if (status === 'error') {
        p('설치 패키지 취약점 조회 실패(error). 이전 표를 현재 조회 결과로 표시하지 않습니다.');
        const allowedCodes = new Set([
          'CANCELLED', 'REQUEST_CANCELLED', 'TIMEOUT', 'REQUEST_TIMEOUT',
          'CONTRACT_MISMATCH', 'SERVICE_UNAVAILABLE', 'HOST_REJECTED',
          'ORIGIN_REJECTED', 'REQUEST_INVALID',
        ]);
        const code = allowedCodes.has(error?.code) ? error.code : 'UNVERIFIED';
        p('오류 코드: ' + code);
        p('오류 메시지: ' + (safeText(error?.message) ?
          error.message.trim() : '조회 실패 원인을 확인할 수 없습니다.'));
        p('오류나 취소를 취약점 없음으로 해석하지 않습니다. 「설치 패키지 조회」를 사용자가 직접 다시 요청할 수 있습니다.');
        return root;
      }
      if (status !== 'ok' || !data || typeof data !== 'object') {
        p('패키지 조회 상태 확인 불가. 검증되지 않은 데이터를 조회 성공으로 표시하지 않습니다.');
        return root;
      }

      const labels = {
        complete: '모두 조회(complete): 허용된 조회 대상의 응답을 확인했습니다.',
        partial: '일부 조회 실패(partial): 이미 확인한 취약점은 유지하며 미확인 항목을 별도로 구분합니다.',
        not_checked: '아직 조회 안 함(not_checked): 승인된 공개 조회 대상이 없어 OSV 조회를 수행하지 않았습니다.',
        not_configured: '조회 준비 미완료(not_configured): 조회 대상 프로젝트 설정이 필요합니다.',
        unverifiable: '잠금 파일 확인 불가(unverifiable): package-lock.json 또는 설치 메타데이터를 검증하지 못했습니다.',
      };
      if (!Object.hasOwn(labels, data.status)) {
        p('패키지 조회 상태 확인 불가: 알 수 없는 전체 결과 상태입니다.');
        return root;
      }
      p('전체 조회 상태: ' + labels[data.status]);
      if (data.code === 'PROJECT_NOT_CONFIGURED') p('안내 코드: PROJECT_NOT_CONFIGURED');
      else if (data.code === 'NO_APPROVED_PACKAGES') p('안내 코드: NO_APPROVED_PACKAGES');
      else if (data.code === 'LOCKFILE_UNVERIFIABLE') p('안내 코드: LOCKFILE_UNVERIFIABLE');

      if (data.lockfileVersion === 2 || data.lockfileVersion === 3)
        p('package-lock.json 잠금 파일 버전(lockfileVersion): ' + data.lockfileVersion);
      if (typeof data.lockfileHash === 'string' && /^[0-9a-f]{64}$/.test(data.lockfileHash))
        p('잠금 파일 SHA-256(lockfileHash): ' + data.lockfileHash);
      if (iso(data.checkedAt)) p('전체 조회 시각(checkedAt): ' + data.checkedAt);

      if (!Array.isArray(data.packages)) {
        p('패키지 목록 확인 불가. 미조회 상태를 취약점 없음으로 판단하지 않습니다.');
        return root;
      }
      if (data.status === 'not_configured' || data.status === 'not_checked' || data.status === 'unverifiable') {
        p('OSV 조회가 완료된 패키지 목록은 없습니다. 취약점이 없다는 뜻이 아닙니다.');
        return root;
      }
      if (data.packages.length === 0) {
        p('표시할 패키지 조회 결과가 없습니다. 조회 대상이 없다는 사실만으로 안전하다고 판단하지 않습니다.');
        return root;
      }

      const headings = {
        known_vulnerabilities: '알려진 취약점 있음(known_vulnerabilities)',
        none_found: '조회 범위에서 알려진 취약점 없음(none_found)',
        unverifiable: '조회 확인 불가(unverifiable)',
      };
      p('조회 대상 패키지 ' + data.packages.length + '건');
      const entries = document.createElement('div');
      root.append(entries);
      for (const row of data.packages) {
        const item = document.createElement('section');
        entries.append(item);
        const nameValid = packageName(row?.name);
        const versionValid = installedVersion(row?.version);
        // 제공 코드의 확인된 패키지와 정확한 버전에만 속성을 지정한다.
        if (nameValid && versionValid) {
          item.setAttribute('data-student-package-name', row.name);
          item.setAttribute('data-student-package-version', row.version);
        }
        add(item, 'h4', '패키지: ' + (nameValid ? row.name : '이름 확인 불가'));
        add(item, 'p', '설치된 정확한 버전: ' + (versionValid ? row.version :
          '설치 버전 확인 불가(범위나 미검증 버전을 실제 설치 버전으로 표시하지 않음)'));
        add(item, 'p', '조회 상태: ' + (headings[row?.status] ?? '조회 상태 확인 불가'));
        if (row?.source === 'https://api.osv.dev/v1/querybatch')
          add(item, 'p', '출처(source): ' + row.source);
        else add(item, 'p', '출처 확인 불가');
        if (iso(row?.checkedAt)) add(item, 'p', '패키지 조회 시각(checkedAt): ' + row.checkedAt);
        else add(item, 'p', '패키지 조회 시각 확인 불가');

        const findings = Array.isArray(row?.vulnerabilities) ? row.vulnerabilities : [];
        if (row?.status === 'unverifiable') {
          add(item, 'p', findings.length ?
            '일부 확인·전체 조회 확인 불가: 확인된 취약점 ID를 유지하지만 전체 조회 완료나 취약점 없음을 주장하지 않습니다.' :
            '패키지별 조회 확인 불가: 취약점 없음으로 판단하지 않습니다.');
        }
        if (row?.status === 'none_found') {
          add(item, 'p', '이 조회 시각과 조회 범위에서는 알려진 취약점 항목을 찾지 못했습니다. 패키지 또는 앱이 안전하다는 보장은 아닙니다.');
        }
        if (row?.status === 'known_vulnerabilities' && findings.length === 0) {
          add(item, 'p', '취약점 정보가 있다고 표시되었지만 식별자를 확인할 수 없습니다.');
        }
        for (const finding of findings) {
          if (safeText(finding?.id, 160) &&
              /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(finding.id)) {
            add(item, 'p', '취약점 ID(id): ' + finding.id);
            add(item, 'p', '취약점 수정 시각(modified): ' +
              (iso(finding.modified) ? finding.modified : '확인 불가'));
          } else {
            add(item, 'p', '취약점 식별자를 확인할 수 없습니다.');
          }
        }
      }
      if (data.status === 'partial')
        p('일부 실패한 패키지는 확인 불가로 유지합니다. 이미 받은 취약점 ID는 삭제하지 않습니다.');
      p('OSV는 알려진 취약점 데이터베이스입니다. 조회 결과만으로 패키지나 앱 전체의 안전을 보장하지 않습니다.');
      return root;
    },
    renderAiConnection({ status = 'idle', mode, data, error, checkedAt, explanationAccepted = false } = {}) {
      const root = document.createElement('div');
      const add = (message) => {
        const p = document.createElement('p');
        p.textContent = message;
        root.append(p);
      };
      if (mode === 'demo') add('예제 응답(demo) · 실제 AI 앱 권한이 확인된 결과가 아닙니다.');
      else if (mode === 'disconnected') add('연결 없음(disconnected)');
      else if (mode === 'unknown') add('연결 상태 확인 불가(unknown)');

      if (status === 'idle') {
        add('AI 연결 점검 전');
        add('계정 연결 또는 승인 상태를 확인한 뒤 「현재 API 연결 점검」을 직접 누르세요.');
        return root;
      }
      if (status === 'loading') {
        add('AI 연결 점검 중');
        add('모델 응답 확인 중이며 사건 설명은 실행하지 않았습니다. 필요하면 제공 화면의 「취소」를 누르세요.');
        return root;
      }

      const guidance = {
        ON_AI_PROVISIONING_PENDING: '앱 권한 준비 중 또는 확인 불가입니다. 담당자에게 계정 연결과 앱 권한을 확인해 달라고 요청하세요.',
        WB_CLCO_AUTH_REQUIRED: '인증 실패입니다. 계정 연결과 앱 승인을 다시 확인하고, 계속되면 담당자에게 문의하세요.',
        WB_CLCO_ACCESS_BLOCKED: 'AI 접근 제한입니다. 담당자에게 이용 권한을 확인해 달라고 요청하세요.',
        WB_CLCO_COHORT_BUDGET_EXHAUSTED: '반 AI 사용량이 소진됐습니다. 담당자에게 사용량을 확인하세요.',
        WB_CLCO_LIMIT_REACHED: 'AI 이용 한도에 도달했습니다. 담당자에게 한도를 확인하세요.',
        WB_CLCO_SESSION_CLOSED: '현재 AI 이용 시간이 아닙니다. 이용 가능한 시간을 확인하세요.',
        WB_CLCO_RATE_LIMITED: 'AI 요청이 제한됐습니다. 잠시 뒤 「현재 API 연결 점검」을 직접 다시 누르세요.',
        WB_CLCO_TIMEOUT: 'AI 응답 시간 초과입니다. 잠시 뒤 사용자가 직접 다시 점검하세요.',
        REQUEST_TIMEOUT: 'AI 요청 시간 초과입니다. 잠시 뒤 사용자가 직접 다시 점검하세요.',
        ENGINE_TIMEOUT: '서버 확인 시간 초과입니다. 잠시 뒤 사용자가 직접 다시 점검하세요.',
        TIMEOUT: 'AI 응답 시간 초과입니다. 잠시 뒤 사용자가 직접 다시 점검하세요.',
        WB_CLCO_NETWORK_ERROR: 'AI 네트워크 연결 오류입니다. 연결 상태를 확인하고 직접 다시 점검하세요.',
        WB_CLCO_SERVER_UNAVAILABLE: 'AI 서버에 연결할 수 없습니다. 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_CANCELLED: '요청이 취소됐습니다. 이전 결과는 현재 점검 성공이 아닙니다.',
        CANCELLED: '요청이 취소됐습니다. 이전 결과는 현재 점검 성공이 아닙니다.',
        REQUEST_CANCELLED: '요청이 취소됐습니다. 이전 결과는 현재 점검 성공이 아닙니다.',
        MODEL_NOT_CONFIGURED: '사용할 AI 모델이 설정되지 않았습니다. 담당자에게 허용 모델 설정을 확인하세요.',
        ON_AI_MODEL_LIST_EMPTY: '현재 앱 권한으로 사용할 수 있는 AI 모델이 없습니다. 담당자에게 모델 허용 설정을 확인하세요.',
        ON_AI_AUTHORIZATION_CHANGED: '점검 중 앱 이용 권한이 변경됐습니다. 담당자에게 현재 권한을 확인하세요.',
        WB_CLCO_INVALID_RESPONSE: 'AI 게이트 응답을 검증할 수 없습니다. 담당자에게 문의하세요.',
        SUBJECT_SCOPE_UNVERIFIED: '현재 계정과 사건의 연결을 확인할 수 없습니다. 담당자에게 확인하세요.',
        ON_AI_INVALID_INPUT: '사건 근거 또는 규칙을 확인할 수 없습니다. 원래 사건 기록을 확인하세요.',
        ON_AI_INVALID_OUTPUT: 'AI 설명의 응답 또는 근거를 확인할 수 없습니다. 담당자에게 문의하세요.',
        AI_REQUEST_UNVERIFIED: 'AI 연결 또는 응답을 확인할 수 없습니다. 계정 승인 상태를 확인하고 담당자에게 문의하세요.',
      };
      const safeFailure = (value) => {
        const code = typeof value?.code === 'string' && Object.hasOwn(guidance, value.code)
          ? value.code : 'AI_REQUEST_UNVERIFIED';
        const supplied = typeof value?.message === 'string' ? value.message.trim() : '';
        const hasSecret = /(?:\bBearer\s+\S+|\bsk-[A-Za-z0-9_-]+|(?:api[_ -]?key|token|password|secret|authorization)\s*[:=]\s*\S+)/i.test(supplied);
        const message = supplied && supplied.length <= 300 && !hasSecret
          ? supplied : '안전하게 표시할 수 있는 오류 세부 메시지가 없습니다.';
        return { code, message };
      };

      if (status === 'error') {
        const failure = safeFailure(error);
        add(`AI 연결 점검 실패 · 코드: ${failure.code}`);
        add(`오류 메시지: ${failure.message}`);
        add(guidance[failure.code]);
        add('오류 상태를 성공으로 표시하지 않습니다. 자동 재시도하지 않으며, 재점검은 사용자가 직접 요청합니다.');
        return root;
      }

      // 연결 모드·검사 시각·권한이 모순되면 모델 점검 성공으로 표시하지 않는다.
      const modelCheckValid = status === 'ok' && data?.transportChecked === true &&
        (data.audienceAuthorization === 'test' || data.audienceAuthorization === 'verified') &&
        Number.isInteger(data.modelCount) && data.modelCount >= 0 && data.modelCount <= 10000 &&
        typeof checkedAt === 'string' && Number.isFinite(Date.parse(checkedAt)) &&
        mode !== 'disconnected' && mode !== 'unknown' &&
        !(mode === 'demo' && data.audienceAuthorization === 'verified');
      if (modelCheckValid) {
        add(data.audienceAuthorization === 'test'
          ? '시험 연결 점검(test) · 실제 앱 권한 확인은 아닙니다.'
          : '앱 권한 확인 후 점검(verified) · 점검 당시 모델 응답을 확인했습니다.');
        add(`응답 모델 수(modelCount): ${data.modelCount}`);
        add(`점검 시각(checkedAt): ${typeof checkedAt === 'string' && checkedAt ? checkedAt : '확인 불가'}`);
        if (data.modelCount === 0) add('현재 사용할 수 있는 모델이 없습니다. 담당자에게 모델 허용 설정을 확인하세요.');
        add('연결 및 모델 목록만 점검했습니다. 사건 설명은 아직 실행하지 않았습니다.');
        add('점검 범위: AI 연결·이용 권한·모델 응답 확인. 사건 분석 성공이나 보안 조치 성공을 의미하지 않습니다.');
        add('사건 설명은 보안 기록에서 별도로 요청하고 결과를 확인해야 합니다.');
        return root;
      }
      add('AI 연결 점검 결과 확인 불가(unknown). 연결 성공으로 처리하지 않습니다.');
      add('제공 화면의 「현재 API 연결 점검」을 직접 눌러 다시 확인하세요. 자동 재점검은 하지 않습니다.');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      // 18단계: 이 호출의 현재 기록과 설명만 사용하며, 반환할 때마다 독립 DOM을 생성한다.
      const root = document.createElement('section');
      const add = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = value;
        root.append(node);
        return node;
      };
      const identifier = (value) => typeof value === 'string' &&
        /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(value);
      const safeText = (value, max) => typeof value === 'string' &&
        value.trim().length > 0 && value.length <= max &&
        !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
      const secret = /(?:\bBearer\s+\S+|\bsk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|token|password|secret|authorization|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const explainError = (value) => {
        const codes = new Set([
          'ON_AI_PROVISIONING_PENDING', 'ON_AI_INVALID_INPUT', 'ON_AI_INVALID_OUTPUT',
          'WB_CLCO_AUTH_REQUIRED', 'WB_CLCO_ACCESS_BLOCKED', 'WB_CLCO_COHORT_BUDGET_EXHAUSTED',
          'WB_CLCO_LIMIT_REACHED', 'WB_CLCO_SESSION_CLOSED', 'WB_CLCO_RATE_LIMITED',
          'WB_CLCO_TIMEOUT', 'WB_CLCO_NETWORK_ERROR', 'WB_CLCO_SERVER_UNAVAILABLE',
          'WB_CLCO_CANCELLED', 'WB_CLCO_INVALID_RESPONSE', 'REQUEST_TIMEOUT',
          'REQUEST_CANCELLED', 'ENGINE_TIMEOUT', 'TIMEOUT', 'CANCELLED',
          'MODEL_NOT_CONFIGURED', 'ON_AI_MODEL_LIST_EMPTY', 'ON_AI_AUTHORIZATION_CHANGED',
          'SUBJECT_SCOPE_UNVERIFIED', 'AI_REQUEST_UNVERIFIED', 'EVENT_NOT_FOUND',
          'CONTRACT_MISMATCH',
        ]);
        const code = codes.has(value?.code) ? value.code : 'AI_REQUEST_UNVERIFIED';
        const message = safeText(value?.message, 300) && !secret.test(value.message)
          ? value.message.trim() : '안전하게 표시할 수 있는 오류 상세 메시지가 없습니다.';
        return { code, message };
      };

      const status = explanation?.status ?? 'idle';
      // 오류는 기록을 선택하지 않았더라도 먼저 알린다.
      if (status === 'error') {
        const failure = explainError(explanation?.error);
        add('h4', 'AI 설명 실패');
        add('p', '분석 상태: 실패 · 검증된 AI 설명 없음');
        add('p', '원본 사건 기록과 별도로 표시합니다. 실패를 사건 없음 또는 안전 판정으로 해석하지 않습니다.');
        add('p', '오류 코드: ' + failure.code);
        add('p', '오류 메시지: ' + failure.message);
        if (failure.code === 'ON_AI_INVALID_INPUT' || failure.code === 'EVENT_NOT_FOUND') {
          add('p', '사건 근거가 부족하거나 입력한 사건을 확인할 수 없어 설명을 생성하지 못했습니다.');
        } else if (failure.code === 'ON_AI_INVALID_OUTPUT' || failure.code === 'WB_CLCO_INVALID_RESPONSE') {
          add('p', 'AI 설명의 근거 또는 응답 형식을 검증할 수 없습니다. 내용을 만들어 보완하지 않습니다.');
        } else if (failure.code === 'ON_AI_PROVISIONING_PENDING' || failure.code === 'WB_CLCO_AUTH_REQUIRED') {
          add('p', '계정 연결·AI 앱 권한을 확인하지 못했습니다. 실제 설명 성공으로 처리하지 않습니다.');
        } else {
          add('p', '요청 또는 응답 검증에 실패했습니다. 실패 원인을 확인한 뒤 사용자가 직접 재확인해야 합니다.');
        }
        add('p', '기존 보안 기록은 그대로 유지됩니다. AI 설명 실패가 방어전 과제 실패를 의미하지는 않습니다.');
        return root;
      }
      if (!event) {
        add('p', '보안 기록에서 기록을 먼저 고르세요.');
        return root;
      }
      if (status === 'loading') {
        add('p', '선택한 사건 ID: ' + (identifier(event.id) ? event.id : '확인 불가'));
        add('p', '선택한 사건의 AI 설명 요청 중입니다. 아직 성공하지 않았습니다.');
        return root;
      }
      if (status !== 'ok') {
        add('p', '선택한 사건 ID: ' + (identifier(event.id) ? event.id : '확인 불가'));
        add('p', 'AI 사건 설명 요청 전입니다. 기록의 AI 설명 기능으로 직접 요청하세요.');
        return root;
      }

      const data = explanation?.data;
      const evidence = Array.isArray(event.evidence) ? event.evidence : [];
      const rules = Array.isArray(event.rules) ? event.rules : null;
      const supported = Array.isArray(event.supportedActions) ? event.supportedActions : null;
      const state = event.state;
      if (!identifier(event.id) || !safeText(data?.summary, 1500) ||
          !evidence.length || !evidence.every(row => identifier(row?.id) && safeText(row?.text, 500)) ||
          !rules || !rules.every(row => identifier(row?.id) && safeText(row?.text, 300)) ||
          !supported || !supported.every(identifier) ||
          !state || typeof state !== 'object' ||
          !['access', 'session', 'device'].every(key => typeof state[key] === 'string') ||
          !Array.isArray(data?.evidenceIds) || !Array.isArray(data?.proposals)) {
        add('p', 'AI 설명 확인 불가: 선택한 사건의 근거·규칙·상태 또는 설명 데이터가 부족합니다.');
        add('p', '근거가 부족한 설명은 사용하지 않으며 기존 보안 기록은 그대로 유지됩니다.');
        return root;
      }
      if (data.executed !== false || data.requiresHumanConfirmation !== true) {
        add('p', 'AI 설명 확인 불가: AI가 조치를 이미 실행했다고 응답했거나 사람 확인 조건이 없습니다.');
        add('p', '이 설명은 사용할 수 없으며 실제 보안 조치는 실행하지 않습니다.');
        return root;
      }
      const byEvidenceId = new Map(evidence.map(row => [row.id, row.text]));
      const cited = data.evidenceIds;
      const allBound = byEvidenceId.size === evidence.length &&
        cited.length === evidence.length && new Set(cited).size === cited.length &&
        cited.every(id => identifier(id) && byEvidenceId.has(id));
      if (!allBound) {
        add('p', 'AI 설명 확인 불가: 인용한 근거 ID가 현재 사건의 근거와 일치하지 않습니다(근거 불일치).');
        add('p', '없는 근거를 만들어 맞추지 않으며 기존 보안 기록은 그대로 유지됩니다.');
        return root;
      }
      const proposalValid = data.proposals.every(proposal =>
        identifier(proposal?.action) && supported.includes(proposal.action) &&
        safeText(proposal.reason, 500) && !secret.test(proposal.reason) &&
        Array.isArray(proposal.evidenceIds) && proposal.evidenceIds.length > 0 &&
        new Set(proposal.evidenceIds).size === proposal.evidenceIds.length &&
        proposal.evidenceIds.every(id => identifier(id) && byEvidenceId.has(id)));
      if (!proposalValid || (supported.length === 0 && data.proposals.length > 0)) {
        add('p', 'AI 설명 확인 불가: 현재 사건에서 지원하지 않는 조치 또는 일치하지 않는 제안 근거가 있습니다.');
        add('p', '조치를 실행하지 않고 기존 보안 기록을 유지합니다.');
        return root;
      }
      // 모순된 연결 상태나 예제 데이터를 실제 AI 생성 성공으로 표시하지 않는다.
      if (['demo', 'disconnected', 'unknown'].includes(explanation?.mode)) {
        add('p', 'AI 설명 확인 불가: 예제·연결 없음·연결 상태 확인 불가에서는 실제 설명을 검증하지 못했습니다.');
        return root;
      }
      if (secret.test(data.summary) || rules.some(row => secret.test(row.text)) ||
          evidence.some(row => secret.test(row.text))) {
        add('p', 'AI 설명 확인 불가: 표시할 수 없는 민감 정보가 포함되어 있습니다.');
        return root;
      }

      // 모든 검증을 마친 현재 사건에만 성공 속성을 붙인다.
      root.setAttribute('data-student-explanation-event', event.id);
      // Display only after all existing explanation/evidence validation succeeds.
      const briefing = document.createElement('section');
      briefing.className = 'argos-v11-ai-briefing';
      briefing.setAttribute('data-argos-v11-ai-briefing', 'true');
      const briefText = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = value;
        briefing.append(node);
      };
      briefText('h4', '케셰브 · 근거 기반 조사 브리핑');
      briefText('p', '선택한 사건: ' + event.id + ' · AI 설명 응답의 근거 결속 검사 통과');
      briefText('p', '사건 요약: ' + data.summary);
      briefText('p', '인용 근거: ' + cited.length + '건 / 전달 근거: ' + evidence.length + '건');
      briefText('p', '조치 제안: ' + data.proposals.length + '건 · 미실행 · 사람 확인 필요');
      const unknownParts = ['access', 'session', 'device'].filter(key => state[key] === 'unknown');
      briefText('p', unknownParts.length
        ? '확인되지 않은 상태: ' + unknownParts.map(key => ({access:'접속',session:'세션',device:'기기'})[key]).join(', ')
        : '상태값 unknown 항목 없음 · 전체 시스템의 안전을 증명하지는 않습니다.');
      briefText('p', '이 브리핑은 원본 데이터와 AI 응답의 일치 범위만 보여줍니다. 실제 공격 판단이나 조치 성공을 보증하지 않습니다.');
      root.append(briefing);
      add('h4', 'AI 설명(참고용)');
      const scope = add('p',
        'AI 설명 상태: 응답 검증 통과 · 참고용');
      scope.setAttribute('data-argos-ai-result-scope', 'reference');
      add('p',
        '검증 범위: 현재 선택한 사건의 근거 ID, 규칙, 조치 제안 및 응답 조건을 확인했습니다. 원천 사실이나 조치 효과를 독립적으로 재검증한 결과는 아닙니다.');
      add('p', '사건 ID: ' + event.id);
      add('p', 'AI 요약: ' + data.summary);
      add('h5', '사건 원본 근거 · AI가 인용한 항목');
      add('p',
        '아래 항목은 현재 사건에 전달된 원본 근거와 일치하는 식별자입니다.');
      cited.forEach(id => add('p', id + ' — ' + byEvidenceId.get(id)));
      add('h5', '적용된 규칙');
      if (rules.length) rules.forEach(rule => add('p', rule.id + ' — ' + rule.text));
      else add('p', '현재 사건에 제공된 규칙이 없습니다.');
      add('h5', '확인할 수 없는 현재 상태');
      const names = { access: '접속', session: '세션', device: '기기' };
      const unknown = ['access', 'session', 'device'].filter(key => state[key] === 'unknown');
      if (unknown.length) unknown.forEach(key => add('p', names[key] + ': 확인 불가(unknown)'));
      else add('p', '없음');
      add('h5', 'AI 조치 제안 · 실행 결과 아님');
      if (!data.proposals.length) {
        add('p', supported.length === 0
          ? '연동 시스템이 지원하는 조치가 없어 AI 제안이 없습니다(정상).'
          : 'AI가 현재 사건에 대해 제안한 조치가 없습니다.');
      } else {
        data.proposals.forEach(proposal => {
          add('p', '제안 조치: ' + proposal.action + ' — 이유: ' + proposal.reason +
            ' — 근거 ID: ' + proposal.evidenceIds.join(', '));
        });
      }
      add('p', '조치 상태: AI 응답상 미실행(executed: false). 실제 실행·효과는 별도의 원천 조치 결과로 확인해야 합니다.');
      add('p', '조치 제안은 사람이 확인해야 실행할 수 있으며, 현재 실행되지 않았습니다(requiresHumanConfirmation: true, executed: false).');
      if (typeof checkedAt === 'string' && Number.isFinite(Date.parse(checkedAt))) {
        add('p', '설명 확인 시각: ' + checkedAt);
      }
      add('p', 'AI 설명은 참고 정보입니다. 실제 사실 판단은 인용한 근거와 원천 시스템의 현재 상태를 기준으로 하세요.');
      add('p', 'AI 설명은 접근 허용·차단의 정책 판정이나 조치 효과의 독립적인 증거가 아니며, 보안 조치를 자동 집행하지 않습니다.');
      return root;
    },
    renderAction({ status = 'idle', event = null, actionId = null, target = null,
      receipt = null, observation = null, message, confirmationExpiresAt, error } = {}) {
      // 19단계: 제공 화면이 전달한 현재 스냅샷만 렌더링한다. 전송·확인 티켓·조치 버튼을 만들지 않는다.
      const root = document.createElement('section');
      const add = (text) => {
        const p = document.createElement('p');
        p.textContent = text;
        root.append(p);
      };
      const validId = value => typeof value === 'string' &&
        /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(value);
      const secret = /(?:\bBearer\s+\S+|\bsk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|token|secret|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const safeText = value => typeof value === 'string' && value.trim().length > 0 &&
        value.length <= 300 && !secret.test(value) &&
        !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
      const knownCodes = new Set([
        'ACTION_UNSUPPORTED', 'ACTION_DENIED', 'ACTION_CONFIRMATION_EXPIRED',
        'ACTION_CONFIRMATION_INVALID', 'ACTION_SCOPE_CHANGED', 'ACTION_SCOPE_UNVERIFIED',
        'SUBJECT_SCOPE_UNVERIFIED', 'ACTION_SNAPSHOT_CHANGED', 'ACTION_EVENT_UNAVAILABLE',
        'ACTION_TIMEOUT', 'ACTION_STORE_FAILED', 'ACTION_RESULT_UNVERIFIED',
        'REQUEST_TIMEOUT', 'REQUEST_CANCELLED', 'CANCELLED', 'CONTRACT_MISMATCH',
      ]);
      const eventId = validId(event?.id) && !secret.test(event.id) ? event.id : null;
      const selectedAction = validId(actionId) && !secret.test(actionId) ? actionId : null;
      const requestId = validId(receipt?.requestId) && !secret.test(receipt.requestId)
        ? receipt.requestId : null;
      const receiptId = validId(receipt?.receiptId) && !secret.test(receipt.receiptId)
        ? receipt.receiptId : null;
      const targetId = typeof target?.id === 'string' &&
        /^(?:subject|device):[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(target.id) &&
        !secret.test(target.id) ? target.id : null;
      const generation = Number.isSafeInteger(target?.generation) && target.generation > 0
        ? target.generation : null;
      const version = Number.isSafeInteger(receipt?.version) && receipt.version > 0
        ? receipt.version : null;
      const timestamp = value => typeof value === 'string' &&
        /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value) &&
        Number.isFinite(Date.parse(value));
      const inconsistent = Boolean(receipt && (
        (receipt.eventId != null && (!eventId || receipt.eventId !== eventId)) ||
        (receipt.actionId != null && (!selectedAction || receipt.actionId !== selectedAction)) ||
        (receipt.target != null && target != null &&
          (receipt.target.id !== targetId || receipt.target.generation !== generation))
      ));
      const bound = Boolean(eventId && selectedAction && requestId && receipt &&
        receipt.eventId === eventId && receipt.actionId === selectedAction && !inconsistent);
      const successObserved = status === 'succeeded' && bound && receiptId && version !== null &&
        receipt?.status === 'succeeded' && receipt?.superseded !== true &&
        observation?.effectApplied === true && timestamp(observation?.observedAt);

      if (status === 'idle') {
        add('조치 미실행(idle). AI의 제안만으로 보안 조치는 실행되지 않습니다.');
        if (safeText(message)) add(message);
        add('「조치 화면 취소」는 이미 서버에 전달한 조치의 효과를 되돌리지 않습니다.');
        return root;
      }
      if (inconsistent) {
        add('결과 불명(unknown): 현재 사건·조치·대상과 요청 영수증의 식별자가 일치하지 않습니다.');
        add('이전 사건의 결과를 현재 사건의 조치 성공으로 표시하지 않습니다. 「연동 시스템 결과만 재조회」로 확인하세요.');
        return root;
      }
      const labels = {
        loading: '조치 준비 또는 연동 시스템 결과 조회 중(loading). 완료나 효과 확인이 아닙니다.',
        prepared: '조치 준비됨·미실행(prepared). 실제 대상과 확인 기한을 검토한 뒤 제공 화면에서 사람이 확인해야 합니다.',
        executing: '사람 확인 후 서버에 조치 요청 전송 중(executing). 접수 또는 실제 효과는 아직 확인되지 않았습니다.',
        pending: '서버 요청 접수·처리 중(pending). 접수 응답(ACK)은 실제 조치 효과를 뜻하지 않습니다.',
        succeeded: successObserved
          ? '연동 시스템에서 실제 효과 확인(succeeded).' :
            '결과 불명(unknown): 상태가 succeeded여도 연동 시스템의 효과 관측을 확인하지 못했습니다.',
        denied: '연동 시스템이 요청을 거절했습니다(denied). 성공이나 조치 효과로 표시하지 않습니다.',
        failed: '연동 시스템의 조치 처리 실패(failed). 실제 효과는 별도로 확인해야 합니다.',
        unknown: '결과 불명(unknown). 성공으로도 효과 없음으로도 판단하지 마세요. 「연동 시스템 결과만 재조회」로 확인하세요.',
        error: '조치 요청 처리 오류(error). 요청이 성공했다고 판단하지 않습니다.',
        expired: '사람 확인 기한 만료(expired). 기존 준비는 실행할 수 없으므로 다시 준비해야 합니다.',
      };
      add(labels[status] ?? '조치 상태 확인 불가(unknown). 결과를 성공으로 판단하지 마세요.');

      // 표식은 현재 사건과 정확히 결속된 영수증에만 붙인다. 효과 확인 여부를 뜻하는 표식은 아니다.
      if (bound) {
        root.setAttribute('data-student-action-event', eventId);
        root.setAttribute('data-student-action-request', requestId);
      }
      if (eventId) add('현재 사건 ID: ' + eventId);
      if (Array.isArray(event?.evidence)) {
        const evidenceIds = event.evidence.map(row => row?.id).filter(id => validId(id) && !secret.test(id));
        if (evidenceIds.length) add('현재 사건 근거 ID: ' + evidenceIds.join(', '));
      }
      if (selectedAction) add('조치 ID: ' + selectedAction);
      if (targetId) add('실제 연동 시스템 대상 ID: ' + targetId);
      if (generation !== null) add('대상 세대(generation): ' + generation);
      if (requestId) add('요청 ID(requestId): ' + requestId);
      if (receiptId) add('접수 영수증 ID(receiptId): ' + receiptId);
      if (version !== null) add('영수증 버전(version): ' + version);
      if (receipt?.replayed === true) {
        add('재전달된 동일 요청(replayed: true)입니다. 새로운 집행이나 중복 실행 성공으로 판단하지 않습니다.');
      }
      if (receipt?.superseded === true) {
        add('이전 조회는 최신 연동 시스템 결과를 대신하지 않습니다(superseded). 결과 불명으로 처리합니다.');
      }
      if (status === 'prepared' && timestamp(confirmationExpiresAt)) {
        add('사람 확인 기한(confirmationExpiresAt): ' + confirmationExpiresAt);
      }
      if (status === 'succeeded') {
        if (successObserved) {
          add('연동 시스템 관측 시각(observedAt): ' + observation.observedAt);
          add('실제 효과 관측(effectApplied: true).');
          add('요청 접수(ACK)와 별도로 연동 시스템의 효과를 확인했습니다.');
        } else {
          add('효과 관측값(effectApplied: true), 관측 시각, 현재 사건에 결속된 영수증을 확인할 수 없습니다.');
          add('새 조치를 보내지 말고 「연동 시스템 결과만 재조회」를 사용하세요.');
        }
      }
      if (status === 'prepared') {
        add('현재 미실행 상태입니다. 사람 확인 없이 조치를 집행하지 않습니다.');
      }
      if (status === 'pending') {
        add('ACK는 요청이 접수됐다는 뜻이며, 처리 효과 확인은 별도 관측이 필요합니다.');
      }
      if (status === 'unknown' || status === 'loading' || status === 'executing') {
        add('현재 상태만 표시합니다. 자동 재전송·중복 집행하지 않습니다.');
      }
      if (status === 'denied' || status === 'failed' || status === 'error') {
        if (safeText(message)) add('처리 사유: ' + message.trim());
        if (error) {
          const code = knownCodes.has(error.code) ? error.code : 'ACTION_RESULT_UNVERIFIED';
          add('오류 코드: ' + code);
          add('오류 메시지: ' + (safeText(error.message) ? error.message.trim() : '상세 오류 메시지 확인 불가'));
        }
      }
      if (status === 'expired') {
        if (safeText(error?.message)) add('만료 사유: ' + error.message.trim());
      }
      if (Array.isArray(event?.supportedActions) && event.supportedActions.length === 0) {
        add('현재 연동 시스템이 지원하는 조치가 없어 조치 준비 버튼이 나타나지 않는 것이 정상입니다.');
      }
      add('학생 화면은 상태만 표시합니다. 조치 준비·사람 확인·결과 재조회는 제공 화면의 버튼으로만 수행합니다.');
      return root;
    },
  };
}

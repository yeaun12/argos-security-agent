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
      const sorted = [...data].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
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
      const count = addText(root, 'p', '');
      const list = document.createElement('ul');
      root.append(list);
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
          && (accessFilter.value === 'all' || event.state.access === accessFilter.value));
        if (!visible.some(event => event.id === selectedId)) selectedId = null;
        count.textContent = `표시 ${visible.length}건 / 받은 기록 ${sorted.length}건`;
        list.replaceChildren();
        if (visible.length === 0) addText(list, 'li', '선택한 조건에 맞는 기록이 없습니다.');
        let focusButton = null;
        for (const event of visible) {
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
            item.append(detail);
          }
          list.append(item);
        }
        if (focusButton) focusButton.focus();
      };
      kindFilter.addEventListener('change', () => renderList());
      appFilter.addEventListener('change', () => renderList());
      accessFilter.addEventListener('change', () => renderList());
      renderList();
      return root;
    },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}

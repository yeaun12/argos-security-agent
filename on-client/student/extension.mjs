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
      if (!Array.isArray(notifications) || notifications.length === 0) {
        addText(alerts, 'p', '주의할 알림이 없습니다.');
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
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
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
        add('p', '보안 기록은 그대로 유지됩니다. AI 설명 실패가 방어전 과제 실패를 의미하지는 않습니다.');
        return root;
      }
      if (!event) {
        add('p', '보안 기록에서 기록을 먼저 고르세요.');
        return root;
      }
      if (status === 'loading') {
        add('p', '선택한 사건의 AI 설명 요청 중입니다. 아직 성공하지 않았습니다.');
        return root;
      }
      if (status !== 'ok') {
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
      add('h4', 'AI 설명(참고용)');
      add('p', '사건 ID: ' + event.id);
      add('p', 'AI 요약: ' + data.summary);
      add('h5', '인용한 근거');
      cited.forEach(id => add('p', id + ' — ' + byEvidenceId.get(id)));
      add('h5', '적용된 규칙');
      if (rules.length) rules.forEach(rule => add('p', rule.id + ' — ' + rule.text));
      else add('p', '현재 사건에 제공된 규칙이 없습니다.');
      add('h5', '확인할 수 없는 현재 상태');
      const names = { access: '접속', session: '세션', device: '기기' };
      const unknown = ['access', 'session', 'device'].filter(key => state[key] === 'unknown');
      if (unknown.length) unknown.forEach(key => add('p', names[key] + ': 확인 불가(unknown)'));
      else add('p', '없음');
      add('h5', '조치 제안');
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
      add('p', '조치 제안은 사람이 확인해야 실행할 수 있으며, 현재 실행되지 않았습니다(requiresHumanConfirmation: true, executed: false).');
      if (typeof checkedAt === 'string' && Number.isFinite(Date.parse(checkedAt))) {
        add('p', '설명 확인 시각: ' + checkedAt);
      }
      add('p', 'AI 설명은 참고 정보입니다. 실제 사실 판단은 인용한 근거와 원천 시스템의 현재 상태를 기준으로 하세요.');
      return root;
    },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}

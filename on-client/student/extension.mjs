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
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}

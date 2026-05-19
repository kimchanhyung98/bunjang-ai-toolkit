export const EXECUTION_MODES = Object.freeze({
  ALLOW: "allow",
  DENY: "deny"
});

export const ENV_VARS = Object.freeze({
  BUNJANG_CLI_BIN: "BUNJANG_CLI_BIN"
});

export const CAPABILITIES = Object.freeze([
  {
    id: "auth.status",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "auth",
    subcommand: "status",
    description: "번개장터 로그인 세션 상태를 확인한다."
  },
  {
    id: "auth.login",
    executionMode: EXECUTION_MODES.DENY,
    command: "auth",
    subcommand: "login",
    description: "헤드풀 브라우저 로그인은 수동 전용이다."
  },
  {
    id: "auth.logout",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "auth",
    subcommand: "logout",
    description: "로컬 번개장터 세션을 제거한다."
  },
  {
    id: "search.listings",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "search",
    description: "상품을 검색한다."
  },
  {
    id: "agent-search-rank",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "agent-search-rank",
    description: "검색, 상세 조회, 후보 순위화를 수행한다."
  },
  {
    id: "item.get",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "item",
    subcommand: "get",
    description: "상품 상세 정보를 조회한다."
  },
  {
    id: "item.list",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "item",
    subcommand: "list",
    description: "여러 상품 상세 정보를 조회한다."
  },
  {
    id: "chat.list",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "chat",
    subcommand: "list",
    description: "채팅 목록을 조회한다."
  },
  {
    id: "chat.read",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "chat",
    subcommand: "read",
    description: "채팅방 메시지를 읽는다."
  },
  {
    id: "chat.start",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "chat",
    subcommand: "start",
    description: "상품 판매자와 새 채팅을 시작한다."
  },
  {
    id: "chat.send",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "chat",
    subcommand: "send",
    description: "채팅방에 메시지를 보낸다."
  },
  {
    id: "favorite.list",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "favorite",
    subcommand: "list",
    description: "관심상품 목록을 조회한다."
  },
  {
    id: "favorite.add",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "favorite",
    subcommand: "add",
    description: "관심상품을 추가한다."
  },
  {
    id: "favorite.remove",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "favorite",
    subcommand: "remove",
    description: "관심상품을 제거한다."
  },
  {
    id: "purchase.prepare",
    executionMode: EXECUTION_MODES.ALLOW,
    command: "purchase",
    subcommand: "prepare",
    description: "구매 가능 여부를 확인한다."
  },
  {
    id: "purchase.start",
    executionMode: EXECUTION_MODES.DENY,
    command: "purchase",
    subcommand: "start",
    description: "구매 흐름 시작은 수동 전용이다."
  },
  {
    id: "purchase.confirm",
    executionMode: EXECUTION_MODES.DENY,
    description: "최종 구매 확정은 수동 전용이다."
  },
  {
    id: "account.settings.update",
    executionMode: EXECUTION_MODES.DENY,
    description: "계정 설정 변경은 수동 전용이다."
  }
]);

const CAPABILITY_BY_ID = new Map(
  CAPABILITIES.map((capability) => [capability.id, capability])
);

export const CAPABILITY_EXECUTION_MODES = Object.freeze(
  Object.fromEntries(
    CAPABILITIES.map((capability) => [
      capability.id,
      capability.executionMode
    ])
  )
);

export const POLICY = Object.freeze({
  loginRequiredCapabilityIds: Object.freeze([
    "chat.list",
    "chat.read",
    "chat.start",
    "chat.send",
    "favorite.list",
    "favorite.add",
    "favorite.remove",
    "purchase.prepare"
  ])
});

export const APP_CONFIG = Object.freeze({
  env: ENV_VARS,
  defaults: Object.freeze({
    bunjangCliBin: "bunjang-cli"
  }),
  executionModes: CAPABILITY_EXECUTION_MODES,
  policy: POLICY
});

export function getCapability(id) {
  const capability = CAPABILITY_BY_ID.get(id);

  if (!capability) {
    throw new Error(`Unknown capability: ${id}`);
  }

  return capability;
}

export function executionModeForCapability(id) {
  return getCapability(id).executionMode;
}

export function getRuntimeConfig({ env = process.env } = {}) {
  return {
    bunjangCliBin: readString(
      env[ENV_VARS.BUNJANG_CLI_BIN],
      APP_CONFIG.defaults.bunjangCliBin
    )
  };
}

function readString(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

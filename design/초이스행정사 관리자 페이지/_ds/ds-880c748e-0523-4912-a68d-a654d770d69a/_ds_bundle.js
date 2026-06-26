/* @ds-bundle: {"format":3,"namespace":"DesignSystem_880c74","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardTitle","sourcePath":"components/core/Card.jsx"},{"name":"CardBody","sourcePath":"components/core/Card.jsx"},{"name":"Label","sourcePath":"components/forms/Input.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Textarea","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Input.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"fe75cc967f47","components/core/Button.jsx":"5df32919add3","components/core/Card.jsx":"d4c463d80938","components/forms/Input.jsx":"253ff84b210f","ui_kits/website/screens.jsx":"e5e170d477d9"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_880c74 = window.DesignSystem_880c74 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const variants = {
  default: {
    background: "var(--badge-bg)",
    color: "var(--badge-fg)"
  },
  primary: {
    background: "var(--color-primary)",
    color: "var(--color-on-primary)"
  },
  outline: {
    background: "transparent",
    color: "var(--text-body)",
    boxShadow: "inset 0 0 0 1px var(--border-default)"
  }
};
function Badge({
  children,
  variant = "default",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-medium)",
      fontSize: "13px",
      lineHeight: 1,
      padding: "6px 12px",
      borderRadius: "var(--radius-pill)",
      whiteSpace: "nowrap",
      ...variants[variant],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: "var(--font-sans)",
  fontWeight: "var(--weight-medium)",
  borderRadius: "var(--radius)",
  border: "1px solid transparent",
  cursor: "pointer",
  whiteSpace: "nowrap",
  textDecoration: "none",
  transition: "background-color .18s ease, color .18s ease, border-color .18s ease",
  userSelect: "none"
};
const sizes = {
  sm: {
    height: "36px",
    padding: "0 14px",
    fontSize: "14px"
  },
  md: {
    height: "44px",
    padding: "0 20px",
    fontSize: "16px"
  },
  lg: {
    height: "52px",
    padding: "0 28px",
    fontSize: "17px"
  }
};
const variants = {
  primary: {
    background: "var(--action-primary)",
    color: "var(--color-on-primary)"
  },
  outline: {
    background: "var(--surface-card)",
    color: "var(--text-heading)",
    borderColor: "var(--border-default)"
  },
  secondary: {
    background: "var(--color-accent-soft)",
    color: "var(--color-primary-dark)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-body)"
  }
};
const hovers = {
  primary: {
    background: "var(--action-primary-hover)"
  },
  outline: {
    background: "var(--surface-subtle)"
  },
  secondary: {
    background: "#d6c9b3"
  },
  ghost: {
    background: "var(--surface-subtle)"
  }
};
function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  disabled = false,
  iconStart,
  iconEnd,
  onClick,
  type = "button",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const Tag = href ? "a" : "button";
  const composed = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(hover && !disabled ? hovers[variant] : null),
    ...(disabled ? {
      opacity: 0.5,
      pointerEvents: "none"
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    type: href ? undefined : type,
    onClick: onClick,
    disabled: href ? undefined : disabled,
    style: composed,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, rest), iconStart, children, iconEnd);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  hover = true,
  padding = "var(--space-6)",
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius)",
      padding,
      transition: "box-shadow .2s ease, transform .2s ease, border-color .2s ease",
      boxShadow: hover && h ? "var(--shadow-card-hover)" : "var(--shadow-xs)",
      transform: hover && h ? "translateY(-2px)" : "none",
      ...style
    }
  }, rest), children);
}
function CardTitle({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("h3", _extends({
    style: {
      fontSize: "var(--text-h3)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-heading)",
      lineHeight: "var(--leading-snug)",
      letterSpacing: "var(--tracking-tight)",
      margin: 0,
      ...style
    }
  }, rest), children);
}
function CardBody({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    style: {
      fontSize: "var(--text-base)",
      color: "var(--text-body)",
      lineHeight: "var(--leading-relaxed)",
      margin: "var(--space-3) 0 0",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card, CardTitle, CardBody });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const fieldStyle = (focus, invalid) => ({
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans)",
  fontSize: "16px",
  color: "var(--text-body)",
  background: "var(--surface-card)",
  border: `1px solid ${invalid ? "#b4452f" : focus ? "var(--color-primary)" : "var(--border-default)"}`,
  borderRadius: "var(--radius)",
  outline: "none",
  boxShadow: focus ? "0 0 0 3px rgba(108,93,76,0.18)" : "none",
  transition: "border-color .15s ease, box-shadow .15s ease"
});
function Label({
  children,
  htmlFor,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      display: "block",
      fontSize: "14px",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-heading)",
      marginBottom: "8px",
      ...style
    }
  }, children);
}
function Input({
  invalid = false,
  style,
  ...rest
}) {
  const [f, setF] = React.useState(false);
  return /*#__PURE__*/React.createElement("input", _extends({
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      ...fieldStyle(f, invalid),
      height: "48px",
      padding: "0 14px",
      ...style
    }
  }, rest));
}
function Textarea({
  invalid = false,
  rows = 4,
  style,
  ...rest
}) {
  const [f, setF] = React.useState(false);
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      ...fieldStyle(f, invalid),
      padding: "12px 14px",
      lineHeight: 1.6,
      resize: "vertical",
      ...style
    }
  }, rest));
}
function Select({
  invalid = false,
  children,
  style,
  ...rest
}) {
  const [f, setF] = React.useState(false);
  return /*#__PURE__*/React.createElement("select", _extends({
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      ...fieldStyle(f, invalid),
      height: "48px",
      padding: "0 40px 0 14px",
      appearance: "none",
      cursor: "pointer",
      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 14px center",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Label, Input, Textarea, Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/screens.jsx
try { (() => {
/* 초이스 행정사 — Website UI kit screens.
 * 디자인 시스템 컴포넌트(window.DesignSystem_880c74)와 Lucide 아이콘으로
 * 실제 홈페이지를 재현. 단일 페이지(home) + 업무분야(services) 전환. */
const DS = window.DesignSystem_880c74;
const {
  Button,
  Badge,
  Card,
  CardTitle,
  CardBody,
  Label,
  Input,
  Select,
  Textarea
} = DS;
const NAV = ["사무소 소개", "업무분야", "의뢰인 후기", "자주 묻는 질문", "블로그", "문의하기"];
const SERVICES = [{
  icon: "user-plus",
  code: "C-3 · C-4",
  title: "단기초청",
  summary: "단기방문·단기취업 초청 및 사증 발급 지원, 초청 사유별 서류 안내."
}, {
  icon: "briefcase",
  code: "D-7 · D-8",
  title: "주재원 · 고위임원",
  summary: "기업 주재원·투자기업 임직원의 체류자격 신청 및 연장 대행."
}, {
  icon: "mic",
  code: "E-6",
  title: "연예인 비자",
  summary: "한국에서 활동하려는 외국인 모델·배우·가수 등을 위한 예술흥행 비자."
}, {
  icon: "graduation-cap",
  code: "E-7",
  title: "전문직 비자",
  summary: "특정활동(전문인력) 체류자격 신청 및 자격 요건 검토."
}, {
  icon: "globe",
  code: "F-4",
  title: "재외동포 · 거소증",
  summary: "재외동포(F-4) 자격 신청과 국내거소신고증(거소증) 발급 대행."
}, {
  icon: "shield-check",
  code: "F-5",
  title: "영주권",
  summary: "영주(F-5) 자격 요건 검토 및 신청 대행."
}, {
  icon: "heart",
  code: "F-6",
  title: "결혼비자",
  summary: "국민의 배우자(F-6) 사증·체류자격 신청 및 심사 대비 지원."
}, {
  icon: "flag",
  code: "국적회복",
  title: "국적회복",
  summary: "과거 대한민국 국적을 보유했던 분의 국적회복 허가 신청 대행."
}];
const STRENGTHS = [{
  icon: "calendar-check",
  title: "비자 전문 사무소",
  desc: "2019년 개소 이후 출입국·비자 업무를 전문으로 운영하며 다양한 사례를 직접 다뤄왔습니다."
}, {
  icon: "user-check",
  title: "행정사가 직접 책임",
  desc: "사무장 없는 사무소. 상담부터 서류 작성·접수까지 전 과정을 시험 출신 행정사가 직접 수행합니다."
}, {
  icon: "compass",
  title: "현실적인 방향 제시",
  desc: "단정적 약속 대신, 의뢰인의 상황을 정확히 검토해 가능한 방향을 솔직하게 안내합니다."
}];
const PROCESS = [{
  icon: "message-square",
  title: "상담 신청",
  desc: "전화 또는 온라인으로 무료 초기 상담을 신청합니다."
}, {
  icon: "clipboard-list",
  title: "검토 · 방향 진단",
  desc: "체류자격과 요건을 검토해 상황에 맞는 현실적인 방향을 제시합니다."
}, {
  icon: "file-check-2",
  title: "서류 작성 · 준비",
  desc: "필요 서류를 안내하고 신청 서류를 정확하게 작성·준비합니다."
}, {
  icon: "stamp",
  title: "접수 · 결과 안내",
  desc: "대행기관으로 직접 접수하고, 진행 상황과 결과를 안내드립니다."
}];
const STATS = [{
  v: "7년+",
  l: "비자·출입국 전문 경력",
  d: "2019년 개소 이후"
}, {
  v: "8개+",
  l: "전문 취급 분야",
  d: "E·F 비자 및 국적 업무"
}, {
  v: "100%",
  l: "행정사 직접 진행",
  d: "사무장 없는 1:1 책임 상담"
}, {
  v: "2개 언어",
  l: "상담 가능",
  d: "한국어 · 영어"
}];
const REVIEWS = [{
  i: "J",
  f: "거소증 (F-4)",
  loc: "미국",
  q: "필요한 서류와 절차를 처음부터 차근차근 설명해 주셔서 막막했던 과정을 안심하고 맡길 수 있었습니다."
}, {
  i: "L",
  f: "결혼비자 (F-6)",
  loc: "중국",
  q: "처음 상담부터 접수까지 행정사님이 직접 챙겨 주셨습니다. 제 상황에 맞춰 현실적으로 방향을 잡아주셨어요."
}, {
  i: "K",
  f: "국적회복",
  loc: "미국",
  q: "오래 걸리는 절차라 걱정이 많았는데, 예상 기간과 준비물을 솔직하게 안내해 주셔서 신뢰가 갔습니다."
}];
const HERO_IMG = "https://images.unsplash.com/photo-1723174391641-59eab110dd4f?w=1920&q=80&auto=format&fit=crop";
function useIcons(dep) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}
const CONTAINER = {
  maxWidth: "1152px",
  margin: "0 auto",
  padding: "0 24px"
};
const SECTION = {
  padding: "96px 0"
};
const Icon = ({
  n,
  style
}) => /*#__PURE__*/React.createElement("i", {
  "data-lucide": n,
  style: style
});

/* ── Header ── */
function Header({
  scrolled,
  onNav
}) {
  const transparent = !scrolled;
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      height: "80px",
      display: "flex",
      alignItems: "center",
      background: transparent ? "transparent" : "rgba(255,255,255,0.96)",
      borderBottom: transparent ? "1px solid transparent" : "1px solid var(--border-default)",
      boxShadow: transparent ? "none" : "var(--shadow-sm)",
      backdropFilter: transparent ? "none" : "blur(8px)",
      transition: "all .3s ease",
      marginTop: "-80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...CONTAINER,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => onNav("home"),
    style: {
      cursor: "pointer",
      fontWeight: 700,
      fontSize: "20px",
      letterSpacing: "-0.02em",
      textDecoration: "none",
      color: transparent ? "#fff" : "var(--text-heading)"
    }
  }, "\uCD08\uC774\uC2A4 \uD589\uC815\uC0AC \uC0AC\uBB34\uC18C"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: "36px",
      fontSize: "15px",
      fontWeight: 500
    }
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", {
    key: n,
    onClick: () => onNav(n === "업무분야" ? "services" : "home"),
    style: {
      cursor: "pointer",
      textDecoration: "none",
      color: transparent ? "rgba(255,255,255,0.9)" : "var(--text-muted)"
    }
  }, n))), /*#__PURE__*/React.createElement(Button, {
    variant: transparent ? "secondary" : "primary",
    size: "sm",
    onClick: () => onNav("home")
  }, "\uBB34\uB8CC \uC0C1\uB2F4")));
}

/* ── Hero ── */
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: "relative",
      minHeight: "92vh",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      background: "#1a1612"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: HERO_IMG,
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(90deg, rgba(20,16,13,0.88) 0%, rgba(20,16,13,0.64) 40%, rgba(20,16,13,0.18) 75%, rgba(20,16,13,0.06) 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...CONTAINER,
      position: "relative",
      zIndex: 2,
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "620px",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "12px",
      color: "var(--color-accent-soft)",
      fontSize: "15px",
      fontWeight: 500,
      letterSpacing: "0.02em"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: "1px",
      width: "32px",
      background: "var(--color-accent-soft)"
    }
  }), "\uCD9C\uC785\uAD6D \xB7 \uBE44\uC790 \uC804\uBB38 \uD589\uC815\uC0AC"), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: "24px",
      fontSize: "58px",
      lineHeight: 1.18,
      color: "#fff"
    }
  }, "\uBCF5\uC7A1\uD55C \uD589\uC815 \uC808\uCC28,", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-accent-soft)"
    }
  }, "\uD63C\uC790 \uACE0\uBBFC\uD558\uC9C0 \uB9C8\uC138\uC694")), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: "24px",
      fontSize: "19px",
      lineHeight: 1.7,
      color: "rgba(255,255,255,0.85)"
    }
  }, "\uAC70\uC18C\uC99D \xB7 \uC601\uC8FC\uAD8C \xB7 \uBE44\uC790 \xB7 \uAD6D\uC801\uAE4C\uC9C0, \uC2DC\uD5D8 \uCD9C\uC2E0 \uD589\uC815\uC0AC\uAC00 \uC9C1\uC811 \uCC45\uC784\uC9D1\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "12px",
      marginTop: "40px"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconEnd: /*#__PURE__*/React.createElement(Icon, {
      n: "arrow-right",
      style: {
        width: 18,
        height: 18
      }
    })
  }, "\uBB34\uB8CC \uC0C1\uB2F4 \uC2E0\uCCAD"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    style: {
      background: "rgba(255,255,255,0.12)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.3)"
    }
  }, "\uC5C5\uBB34\uBD84\uC57C \uBCF4\uAE30")), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: "32px",
      fontSize: "14px",
      color: "rgba(255,255,255,0.7)"
    }
  }, "\uC0AC\uBB34\uC7A5 \uC5C6\uB294 \uC0AC\uBB34\uC18C \xB7 \uC2DC\uD5D8 \uCD9C\uC2E0 \uD589\uC815\uC0AC \uC9C1\uC811 \uC0C1\uB2F4 \xB7 \uBC95\uBB34\uBD80 \uB4F1\uB85D \uCD9C\uC785\uAD6D\uBBFC\uC6D0 \uB300\uD589\uAE30\uAD00"))));
}

/* ── Trust marquee ── */
function TrustBand() {
  const items = ["거소증 F-4", "영주권 F-5", "결혼비자 F-6", "연예인 비자 E-6", "전문직 비자 E-7", "국적회복", "단기초청 C-3"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-primary-dark)",
      color: "rgba(255,255,255,0.85)",
      padding: "16px 0",
      overflow: "hidden",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      gap: "48px",
      animation: "marquee 28s linear infinite",
      paddingLeft: "48px"
    }
  }, [...items, ...items, ...items].map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: "15px",
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: "48px"
    }
  }, t, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-primary-light)"
    }
  }, "\u25C6")))));
}

/* ── Strengths ── */
function Strengths() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...SECTION,
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: CONTAINER
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "WHY CHOICE",
    title: "\uCD08\uC774\uC2A4 \uD589\uC815\uC0AC\uB97C \uC120\uD0DD\uD558\uB294 \uC774\uC720"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: "24px",
      marginTop: "48px"
    }
  }, STRENGTHS.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.title
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: "var(--radius)",
      background: "var(--color-accent-soft)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "20px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: s.icon,
    style: {
      width: 26,
      height: 26,
      color: "var(--color-primary-dark)",
      strokeWidth: 1.75
    }
  })), /*#__PURE__*/React.createElement(CardTitle, null, s.title), /*#__PURE__*/React.createElement(CardBody, null, s.desc))))));
}

/* ── Services grid ── */
function ServicesGrid({
  compact
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...SECTION,
      background: "var(--surface-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: CONTAINER
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "SERVICES",
    title: "\uC5C5\uBB34\uBD84\uC57C",
    sub: "\uCD9C\uC785\uAD6D\xB7\uBE44\uC790 \uC804 \uBD84\uC57C\uB97C \uC2DC\uD5D8 \uCD9C\uC2E0 \uD589\uC815\uC0AC\uAC00 \uC9C1\uC811 \uB2E4\uB8F9\uB2C8\uB2E4."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: "20px",
      marginTop: "48px"
    }
  }, (compact ? SERVICES : SERVICES).map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.title,
    padding: "24px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "16px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: s.icon,
    style: {
      width: 28,
      height: 28,
      color: "var(--color-primary)",
      strokeWidth: 1.75
    }
  }), /*#__PURE__*/React.createElement(Badge, null, s.code)), /*#__PURE__*/React.createElement(CardTitle, {
    style: {
      fontSize: "18px"
    }
  }, s.title), /*#__PURE__*/React.createElement(CardBody, {
    style: {
      fontSize: "15px"
    }
  }, s.summary))))));
}

/* ── Process ── */
function Process() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...SECTION,
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: CONTAINER
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "PROCESS",
    title: "\uC9C4\uD589 \uC808\uCC28",
    sub: "\uC0C1\uB2F4\uBD80\uD130 \uACB0\uACFC \uC548\uB0B4\uAE4C\uC9C0, \uBAA8\uB4E0 \uACFC\uC815\uC744 \uD589\uC815\uC0AC\uAC00 \uC9C1\uC811 \uCC59\uAE41\uB2C8\uB2E4."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: "24px",
      marginTop: "48px"
    }
  }, PROCESS.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.title
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "13px",
      fontWeight: 700,
      color: "var(--color-primary)",
      background: "var(--color-accent-soft)",
      width: 28,
      height: 28,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, i + 1), /*#__PURE__*/React.createElement(Icon, {
    n: p.icon,
    style: {
      width: 24,
      height: 24,
      color: "var(--color-primary)",
      strokeWidth: 1.75
    }
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: "18px",
      marginBottom: "8px"
    }
  }, p.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "15px",
      color: "var(--text-body)",
      lineHeight: 1.7
    }
  }, p.desc))))));
}

/* ── Stats ── */
function Stats() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--color-primary)",
      padding: "72px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...CONTAINER,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: "24px"
    }
  }, STATS.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.l,
    style: {
      textAlign: "center",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "44px",
      fontWeight: 700,
      letterSpacing: "-0.02em"
    }
  }, s.v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "16px",
      fontWeight: 500,
      marginTop: "8px"
    }
  }, s.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "14px",
      color: "rgba(255,255,255,0.7)",
      marginTop: "4px"
    }
  }, s.d)))));
}

/* ── Reviews ── */
function Reviews() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...SECTION,
      background: "var(--surface-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: CONTAINER
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "REVIEWS",
    title: "\uC758\uB8B0\uC778 \uD6C4\uAE30"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: "24px",
      marginTop: "48px"
    }
  }, REVIEWS.map(r => /*#__PURE__*/React.createElement(Card, {
    key: r.i,
    hover: false
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "quote",
    style: {
      width: 28,
      height: 28,
      color: "var(--color-primary-light)",
      marginBottom: "12px"
    }
  }), /*#__PURE__*/React.createElement(CardBody, {
    style: {
      marginTop: 0,
      fontSize: "15px"
    }
  }, r.q), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginTop: "20px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "var(--color-accent-soft)",
      color: "var(--color-primary-dark)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700
    }
  }, r.i), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "14px",
      fontWeight: 600,
      color: "var(--text-heading)"
    }
  }, r.f), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "13px",
      color: "var(--text-muted)"
    }
  }, r.loc))))))));
}

/* ── Contact ── */
function Contact() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...SECTION,
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...CONTAINER,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "64px",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "CONTACT",
    title: "\uC0C1\uB2F4\uC774 \uD544\uC694\uD558\uC2E0\uAC00\uC694?",
    sub: "\uC678\uBD80 \uCD9C\uC7A5\uC774 \uB9CE\uC544 \uB0B4\uBC29 \uC0C1\uB2F4\uC740 \uBC18\uB4DC\uC2DC \uC0AC\uC804 \uC5F0\uB77D \uBD80\uD0C1\uB4DC\uB9BD\uB2C8\uB2E4.",
    align: "left"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "32px",
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    }
  }, [["phone", "02-6959-9886"], ["mail", "choice@kvisa1345.com"], ["map-pin", "서울특별시 중구 세종대로 136, 서울파이낸스센터 3층"]].map(([ic, t]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: ic,
    style: {
      width: 20,
      height: 20,
      color: "var(--color-primary)",
      strokeWidth: 1.75
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "16px"
    }
  }, t))))), /*#__PURE__*/React.createElement(Card, {
    hover: false,
    padding: "32px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "cn"
  }, "\uC131\uD568"), /*#__PURE__*/React.createElement(Input, {
    id: "cn",
    placeholder: "\uD64D\uAE38\uB3D9"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "cp"
  }, "\uC5F0\uB77D\uCC98"), /*#__PURE__*/React.createElement(Input, {
    id: "cp",
    placeholder: "010-0000-0000"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "cf"
  }, "\uC0C1\uB2F4 \uD76C\uB9DD \uBD84\uC57C"), /*#__PURE__*/React.createElement(Select, {
    id: "cf"
  }, /*#__PURE__*/React.createElement("option", null, "E-6 \uC5F0\uC608\uC778 \uBE44\uC790"), /*#__PURE__*/React.createElement("option", null, "E-7 \uC804\uBB38\uC9C1 \uBE44\uC790"), /*#__PURE__*/React.createElement("option", null, "\uAC70\uC18C\uC99D (F-4)"), /*#__PURE__*/React.createElement("option", null, "\uC601\uC8FC\uAD8C (F-5)"), /*#__PURE__*/React.createElement("option", null, "\uACB0\uD63C\uBE44\uC790 (F-6)"), /*#__PURE__*/React.createElement("option", null, "\uAD6D\uC801\uD68C\uBCF5"), /*#__PURE__*/React.createElement("option", null, "\uAE30\uD0C0"))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "cm"
  }, "\uBB38\uC758 \uB0B4\uC6A9"), /*#__PURE__*/React.createElement(Textarea, {
    id: "cm",
    rows: 4,
    placeholder: "\uC0C1\uD669\uC744 \uAC04\uB2E8\uD788 \uC801\uC5B4\uC8FC\uC138\uC694."
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    style: {
      width: "100%",
      marginTop: "20px"
    }
  }, "\uBB34\uB8CC \uC0C1\uB2F4 \uC2E0\uCCAD"))));
}

/* ── Footer ── */
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--color-primary-dark)",
      color: "rgba(255,255,255,0.7)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "1152px",
      margin: "0 auto",
      padding: "56px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid rgba(255,255,255,0.15)",
      paddingBottom: "28px",
      flexWrap: "wrap",
      gap: "16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontWeight: 700,
      fontSize: "20px",
      letterSpacing: "-0.02em"
    }
  }, "\uCD08\uC774\uC2A4 \uD589\uC815\uC0AC \uC0AC\uBB34\uC18C"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: "24px",
      fontSize: "14px",
      flexWrap: "wrap"
    }
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", {
    key: n,
    style: {
      color: "rgba(255,255,255,0.8)",
      textDecoration: "none"
    }
  }, n)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "28px",
      fontSize: "14px",
      lineHeight: 1.8
    }
  }, /*#__PURE__*/React.createElement("p", null, "\uC8FC\uC18C \uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC911\uAD6C \uC138\uC885\uB300\uB85C 136, \uC11C\uC6B8\uD30C\uC774\uB0B8\uC2A4\uC13C\uD130 3\uCE35"), /*#__PURE__*/React.createElement("p", null, "\uB300\uD45C \uD589\uC815\uC0AC \u25CB\u25CB\u25CB \xB7 \uC804\uD654 02-6959-9886 \xB7 \uC774\uBA54\uC77C choice@kvisa1345.com"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "rgba(255,255,255,0.5)"
    }
  }, "\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638 464-11-00966 \xB7 \uD589\uC815\uC0AC \uB4F1\uB85D\uBC88\uD638 18102025537 \xB7 \uCD9C\uC785\uAD6D\uBBFC\uC6D0 \uB300\uD589\uAE30\uAD00 19-SB-RG-016"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "rgba(255,255,255,0.45)",
      fontSize: "13px",
      marginTop: "12px"
    }
  }, "\xA9 2026 \uCD08\uC774\uC2A4 \uD589\uC815\uC0AC \uC0AC\uBB34\uC18C. ALL RIGHTS RESERVED."))));
}

/* ── Shared section head ── */
function SectionHead({
  eyebrow,
  title,
  sub,
  align = "center"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      maxWidth: align === "center" ? "640px" : "none",
      margin: align === "center" ? "0 auto" : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "13px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      color: "var(--color-accent)"
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: "34px",
      marginTop: "12px"
    }
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "17px",
      color: "var(--text-muted)",
      marginTop: "12px",
      lineHeight: 1.7
    }
  }, sub));
}

/* ── App ── */
function App() {
  const [route, setRoute] = React.useState("home");
  const [scrolled, setScrolled] = React.useState(false);
  const ref = React.useRef(null);
  useIcons();
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [route, scrolled]);
  React.useEffect(() => {
    const el = ref.current;
    const on = () => setScrolled(el.scrollTop > 24);
    el.addEventListener("scroll", on, {
      passive: true
    });
    return () => el.removeEventListener("scroll", on);
  }, []);
  const nav = r => {
    setRoute(r);
    ref.current.scrollTo({
      top: 0
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      height: "100vh",
      overflowY: "auto",
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement(Header, {
    scrolled: scrolled || route !== "home",
    onNav: nav
  }), route === "home" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(TrustBand, null), /*#__PURE__*/React.createElement(Strengths, null), /*#__PURE__*/React.createElement(ServicesGrid, null), /*#__PURE__*/React.createElement(Process, null), /*#__PURE__*/React.createElement(Stats, null), /*#__PURE__*/React.createElement(Reviews, null), /*#__PURE__*/React.createElement(Contact, null)) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-accent-soft)",
      padding: "64px 0 48px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: CONTAINER
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: "40px"
    }
  }, "\uC5C5\uBB34\uBD84\uC57C"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "18px",
      color: "var(--color-primary-dark)",
      marginTop: "12px"
    }
  }, "\uCD9C\uC785\uAD6D\xB7\uBE44\uC790 \uC804 \uBD84\uC57C\uB97C \uC2DC\uD5D8 \uCD9C\uC2E0 \uD589\uC815\uC0AC\uAC00 \uC9C1\uC811 \uB2E4\uB8F9\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement(ServicesGrid, null), /*#__PURE__*/React.createElement(Process, null), /*#__PURE__*/React.createElement(Contact, null)), /*#__PURE__*/React.createElement(Footer, null));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardTitle = __ds_scope.CardTitle;

__ds_ns.CardBody = __ds_scope.CardBody;

__ds_ns.Label = __ds_scope.Label;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Select = __ds_scope.Select;

})();

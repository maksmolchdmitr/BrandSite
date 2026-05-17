/** Стандартный HeadBar на страницах бадминтона (Главная / Продукты / Бадминтон). */
export function getDefaultBadmintonHeadItems(t) {
  return [
    { text: t("common.nav.main"), ref: "/?page=main", isMainSwitch: false },
    { text: t("common.nav.products"), ref: "/?page=products", isMainSwitch: false },
    { text: t("common.nav.badminton"), ref: "/?page=badminton&section=ratings", isMainSwitch: true },
  ];
}

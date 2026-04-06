// Menu types — only types and data used by useMenuTranslation
export interface MenuChildItem {
  childtitle: string;
  childlink: string;
  childicon?: string;
  isBlank?: boolean;
  isExternal?: boolean;
}

export interface MenuItem {
  isHeadr?: boolean;
  title: string;
  icon?: string;
  link?: string;
  child?: MenuChildItem[];
  isHide?: boolean;
}

export const menuItems: MenuItem[] = [
  {
    isHeadr: true,
    title: "menu",
  },
  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "#",
    child: [
      {
        childtitle: "Grafana",
        childlink: "http://localhost:3000",
        isBlank: true,
      },
      {
        childtitle: "Prometheus",
        childlink: "http://localhost:9090",
        isBlank: true,
      },
      {
        childtitle: "Keycloak",
        childlink: "http://localhost:8080",
        isBlank: true,
      },
      {
        childtitle: "MailHog",
        childlink: "http://localhost:8025",
        isBlank: true,
      },
      {
        childtitle: "RabbitMQ",
        childlink: "http://localhost:15672",
        isBlank: true,
      },
      {
        childtitle: "Elasticsearch",
        childlink: "http://localhost:9200",
        isBlank: true,
      },
      {
        childtitle: "Redi Insight",
        childlink: "http://localhost:5540",
        isBlank: true,
      },
      {
        childtitle: "Github",
        childlink: "https://github.com/aspnetrun/run-aspnetcore-microservices",
        isBlank: true,
      },
      {
        childtitle: "App Store",
        childlink: "http://localhost:3001",
        isBlank: true,
      },
    ],
  },
  {
    isHeadr: true,
    title: "Pages",
  },
  {
    title: "Products",
    icon: "heroicons:cube",
    link: "#",
    child: [
      {
        childtitle: "Quản lý sản phẩm",
        childlink: "products",
      },
      {
        childtitle: "Tạo sản phẩm",
        childlink: "create-product",
      },
      {
        childtitle: "Quản lý kho",
        childlink: "inventories",
      },
      {
        childtitle: "Quản lý danh mục",
        childlink: "categories",
      },
      {
        childtitle: "Quản lý thương hiệu",
        childlink: "brands",
      },
    ],
  },
  {
    title: "Coupons",
    icon: "heroicons:ticket",
    link: "#",
    child: [
      {
        childtitle: "Quản lý mã giảm giá",
        childlink: "coupons",
      },
      {
        childtitle: "Tạo mã giảm giá",
        childlink: "create-coupon",
      },
    ],
  },
  {
    title: "Orders",
    icon: "heroicons:shopping-bag",
    link: "orders",
  },
  {
    title: "Invoice",
    icon: "heroicons:document-text",
    link: "invoice",
  },
  {
    isHeadr: true,
    title: "Settings",
  },
  {
    title: "Profile",
    icon: "heroicons:user-circle",
    link: "profile",
  },
  {
    title: "Settings",
    icon: "heroicons:cog-6-tooth",
    link: "settings",
  },
];

export const topMenu: MenuItem[] = [
  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "dashboard",
  },
  {
    title: "Products",
    icon: "heroicons:cube",
    child: [
      {
        childtitle: "Manage Products",
        childlink: "products",
        childicon: "heroicons:cube",
      },
      {
        childtitle: "Create Product",
        childlink: "create-product",
        childicon: "heroicons:plus-circle",
      },
      {
        childtitle: "Inventory",
        childlink: "inventories",
        childicon: "heroicons:archive-box",
      },
      {
        childtitle: "Categories",
        childlink: "categories",
        childicon: "heroicons:tag",
      },
    ],
  },
  {
    title: "Coupons",
    icon: "heroicons:ticket",
    child: [
      {
        childtitle: "Manage Coupons",
        childlink: "coupons",
        childicon: "heroicons:ticket",
      },
      {
        childtitle: "Create Coupon",
        childlink: "create-coupon",
        childicon: "heroicons:plus-circle",
      },
    ],
  },
  {
    title: "Orders",
    icon: "heroicons:shopping-bag",
    link: "orders",
  },
  {
    title: "Customers",
    icon: "heroicons:users",
    link: "customers",
  },
  {
    title: "Invoice",
    icon: "heroicons:document-text",
    link: "invoice",
  },
];

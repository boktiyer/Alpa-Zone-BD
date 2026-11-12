// Row types that mirror supabase/01_schema.sql.

export type UserRole = 'customer' | 'admin';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type DeliveryArea = 'dhaka' | 'outside';
export type PaymentMethod = 'bkash' | 'nagad' | 'cod';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
export type DiscountType = 'percent' | 'fixed';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export const DELIVERY_CHARGE: Record<DeliveryArea, number> = { dhaka: 60, outside: 120 };

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name_en: string;
  name_bn: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name_en: string;
  name_bn: string;
  slug: string;
  description_en: string | null;
  description_bn: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
  /** Calculated by the database from price and compare_at_price (0 = no discount). */
  discount_percent: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock: number;
  /** null → use the product price */
  price: number | null;
  sku: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  address: string;
  district: string | null;
  note: string | null;
  delivery_area: DeliveryArea;
  delivery_charge: number;
  subtotal: number;
  discount: number;
  total: number;
  coupon_id: string | null;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  /** Wallet the advance was sent with: bkash or nagad. */
  advance_via: PaymentMethod | null;
  /** COD → delivery charge; bKash/Nagad → full total. */
  advance_amount: number;
  transaction_id: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_name_bn: string | null;
  variant_label: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Banner {
  id: string;
  title_en: string | null;
  title_bn: string | null;
  subtitle_en: string | null;
  subtitle_bn: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

// ---- Shapes returned by joined queries -------------------------------
export type ProductCardData = Product & {
  product_images: Pick<ProductImage, 'url' | 'alt' | 'is_primary' | 'sort_order'>[];
};

export type ProductDetail = Product & {
  product_images: ProductImage[];
  product_variants: ProductVariant[];
  categories: Pick<Category, 'id' | 'name_en' | 'name_bn' | 'slug'> | null;
};

// ---- Cart ------------------------------------------------------------
export interface CartLine {
  id: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name_en: string;
  name_bn: string;
  imageUrl: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  /** Units that can still be bought (0 when unavailable). */
  stock: number;
  lineTotal: number;
}

export interface Cart {
  lines: CartLine[];
  subtotal: number;
  count: number;
}

// ---- Order as shown to a customer (success, tracking, my orders) -----
export interface OrderViewItem {
  product_name: string;
  product_name_bn: string | null;
  variant_label: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderView {
  order_number: string;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  delivery_area: DeliveryArea;
  delivery_charge: number;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  advance_amount: number;
  items: OrderViewItem[];
  history: { status: OrderStatus; created_at: string }[];
}

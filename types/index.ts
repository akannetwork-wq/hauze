// ==================================
// NETSPACE Type Definitions
// ==================================

/**
 * Core Page entity representing CMS pages
 */
export interface Page {
    id: string;
    tenant_id: string;
    title: string;
    path: string;
    template_key: string;
    // New default content fields
    description: string;        // Short description / meta desc
    content: string;            // Rich text content (HTML)
    cover_image: string | null; // Cover/featured image URL
    cover_thumb: string | null; // Thumbnail URL
    // Dynamic sections
    sections: Section[];
    seo: Record<string, unknown>;
    is_published: boolean;
    menu_location: MenuLocation;
    parent_id: string | null;
    sort_order: number;
    locales: Record<string, LocaleContent>;
    created_at: string;
    updated_at: string;
}

/**
 * Menu location options for pages
 */
export type MenuLocation = 'main' | 'footer' | 'deep' | 'hidden';

/**
 * Content section within a page
 */
export interface Section {
    id: string;
    type: SectionType;
    content: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    styles?: {
        paddingTop?: string;
        paddingBottom?: string;
        backgroundColor?: string;
        containerWidth?: 'full' | 'boxed';
        [key: string]: any;
    };
}

/**
 * Available section types
 */
export type SectionType =
    | 'hero'
    | 'text'
    | 'cta'
    | 'product-grid'
    | 'features'
    | 'gallery'
    | 'faq'
    | 'video'
    | 'html'
    | 'testimonials'
    | 'contact'
    | 'stats';

/**
 * Localized content for i18n support
 */
export interface LocaleContent {
    title?: string;
    path?: string;
    description?: string;  // Localized description
    content?: string;      // Localized rich content
    cover_image?: string;  // Localized cover image
    cover_thumb?: string;  // Localized thumbnail
    [key: string]: string | undefined;
}

/**
 * Tenant entity representing a customer/organization
 */
export interface Tenant {
    id: string;
    name: string;
    hostname: string;
    config: Record<string, unknown>;
    is_platform_operator: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Module associated with a tenant
 */
export interface TenantModule {
    key: string;
    name: string;
}

/**
 * Tenant context returned from getCurrentContext()
 */
export interface TenantContext {
    tenant: Tenant;
    modules: TenantModule[];
}

/**
 * Price/Product entity for commerce module
 */
export interface Price {
    id: string;
    tenant_id: string;
    sku: string;
    amount: number;
    currency: string;
    list_key: string;
    rules: Record<string, unknown>;
}

/**
 * Inventory pool (warehouse/virtual pool)
 */
export interface InventoryPool {
    id: string;
    tenant_id: string;
    key: string;
    strategy: 'stock' | 'time-slot' | 'date-range';
    config: Record<string, unknown>;
    created_at: string;
}

/**
 * Inventory item within a pool
 */
export interface InventoryItem {
    id: string;
    tenant_id: string;
    pool_id: string;
    sku: string;
    state: {
        on_hand?: number;
        reserved?: number;
        [key: string]: unknown;
    };
    updated_at: string;
    inventory_pools?: { key: string };
}

/**
 * Order entity
 */
export interface Order {
    id: string;
    tenant_id: string;
    customer_id: string | null;
    status: string;
    currency: string;
    total: number;
    lines: OrderLine[];
    created_at: string;
    updated_at: string;
}

/**
 * Order line item
 */
export interface OrderLine {
    sku: string;
    quantity: number;
    price?: number;
    name?: string;
}

/**
 * Product Category for organization
 */
export interface ProductCategory {
    id: string;
    tenant_id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    images: string[];
    sort_order: number;
    type: 'product' | 'consumable' | 'service';
    locales: Record<string, { name?: string; description?: string }>;
    created_at: string;
    updated_at: string;
}

/**
 * Unified Product entity (Products & Services)
 */
export interface Product {
    id: string;
    tenant_id: string;
    category_id: string | null;
    sku: string;
    slug: string;
    unit?: string | null;
    type: 'product' | 'consumable' | 'service';
    title: string;
    description: string | null;
    content: string;
    barcode?: string | null;
    cover_image?: string | null;
    cover_thumb?: string | null;
    images: string[];
    is_active: boolean;
    allow_sale: boolean;
    allow_purchase: boolean;
    allow_consumable: boolean;
    is_ecommerce_active: boolean;
    metadata: Record<string, any>;
    locales: Record<string, {
        title?: string;
        description?: string;
        content?: string;
    }>;
    created_at: string;
    updated_at: string;

    // Virtual fields (joined)
    price?: Price;
    prices?: Price[]; // Added for list views where all prices might be needed
    inventory?: InventoryItem[];
    category_ids?: string[]; // Multiple categories support
    variants?: ProductVariant[];
    digital_meta?: ProductDigitalMeta;
}

export interface ProductVariant {
    id?: string;
    tenant_id?: string;
    product_id?: string;
    sku: string;
    title: string;
    barcode?: string | null;
    image_url?: string | null;
    attributes: Record<string, string>; // e.g. {"Size": "L", "Color": "Blue"}
    price?: number; // Optional override
    initial_stock?: number; // Virtual for editor UI
    is_active: boolean;
    created_at?: string;
    updated_at?: string;

    // Virtual fields
    inventory?: InventoryItem[];
}

export interface ProductDigitalMeta {
    id: string;
    tenant_id: string;
    product_id: string;
    file_url?: string;
    download_limit?: number;
    expiry_days?: number;
    access_rules: Record<string, any>;
    updated_at: string;
}

/**
 * Server action result type
 */
export interface ActionResult {
    success?: boolean;
    error?: string;
}

/**
 * Page order update payload
 */
export interface PageOrderItem {
    id: string;
    sort_order: number;
    menu_location: string;
    parent_id?: string | null;
}

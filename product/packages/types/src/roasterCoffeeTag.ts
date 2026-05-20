/** Values persisted for roaster QR tag flow (see meta/docs/funcup-src-docs/01-vision/qr-generate-roaster.md). */
export type RoasterCoffeeBeanType = 'arabica' | 'robusta';

export interface RoasterCoffeeTagForm {
  roaster_short_name: string;
  img_coffee_label: string;
  bean_origin_country: string;
  bean_origin_farm: string;
  bean_origin_tradename: string;
  bean_origin_region: string;
  bean_type: RoasterCoffeeBeanType;
  bean_varietal_main: string;
  bean_varietal_extra: string;
  bean_origin_height: number;
  bean_processing: string;
  bean_roast_date: string;
  bean_roast_level: string;
  brew_method: string;
  tasting_note_ids: string[];
}

export interface RoasterCoffeeTagRow extends RoasterCoffeeTagForm {
  id: string;
  /** Public identifier encoded in QR (`/q/{public_hash}`). Set by DB on insert. */
  public_hash: string;
  roaster_id: string;
  created_at: string;
  updated_at: string;
}

export type RoasterCoffeeTagInsert = RoasterCoffeeTagForm & {
  roaster_id: string;
};

/** Alias: persisted row shape for consumer-app integration. */
export type RoasterCoffeeTag = RoasterCoffeeTagRow;

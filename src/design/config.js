/**
 * Zentrale Konstanten.
 *
 * APP_NAME ist der Platzhalter für den Produktnamen. Er steht ausschließlich
 * hier, in Texten wird er über {{app}} eingesetzt, nie direkt geschrieben.
 * Zum Umbenennen des Produkts genügt eine Änderung an dieser Stelle.
 */
export const APP_NAME = 'Tellerrand'

/** MVP-Stufe. Steuert, was ausgegraut bzw. mit „Bald“ markiert wird. */
export const MVP_STAGE = 0

/** Version, wie sie in den Einstellungen angezeigt wird. */
export const APP_VERSION = '0.1.0'

/** Auswahlwerte für den Umkreis (C.2, C.6, E.10). */
export const RADIUS_OPTIONS = [1, 5, 10, 25, 50]

/** Standard-Umkreis. */
export const DEFAULT_RADIUS = 5

/** Preisklassen. */
export const PRICE_LEVELS = ['€', '€€', '€€€', '€€€€']

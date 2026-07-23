/**
 * MLS API Client
 * This file acts as a central hub for all API operations.
 * Logic is modularized into the ./api directory for better maintainability.
 */

export * from "./api/types";
export * from "./api/client";
export * from "./api/properties";
export * from "./api/feedback";
export * from "./api/inquiries";
export * from "./api/vlogs";
export {
  uploadPreConnProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  fetchEstatePropertySchema,
  fetchEstateProperties,
  fetchEstatePropertyById as fetchAdminEstatePropertyById,
  createEstateProperty,
  updateEstateProperty,
  deleteEstateProperty,
} from "./api/admin";
export type { EstatePropertyRecord, EstatePropertyListResponse } from "./api/admin";
export * from "./api/testing";
export * from "./api/wordpress";
export * from "./api/auth";
export * from "./api/watched";
export * from "./api/listingSubmissions";

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmRecordSchema = exports.DataSourceEnum = exports.CrmStatusEnum = void 0;
const zod_1 = require("zod");
exports.CrmStatusEnum = zod_1.z.enum([
    'GOOD_LEAD_FOLLOW_UP',
    'DID_NOT_CONNECT',
    'BAD_LEAD',
    'SALE_DONE',
]);
exports.DataSourceEnum = zod_1.z.enum([
    'leads_on_demand',
    'meridian_tower',
    'eden_park',
    'varah_swamy',
    'sarjapur_plots',
]);
exports.CrmRecordSchema = zod_1.z.object({
    created_at: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    country_code: zod_1.z.string().optional(),
    mobile_without_country_code: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    lead_owner: zod_1.z.string().optional(),
    crm_status: exports.CrmStatusEnum.optional(),
    crm_note: zod_1.z.string().optional(),
    data_source: exports.DataSourceEnum.optional(),
    possession_time: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
}).refine((data) => data.email || data.mobile_without_country_code, {
    message: 'no email or mobile number found',
});

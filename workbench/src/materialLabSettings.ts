import {z} from 'zod'

export const materialSettingsSchema=z.object({
 version:z.literal(1), finish:z.enum(['gloss','jelly','cat']), color:z.string().regex(/^#[\da-f]{6}$/i),
 angle:z.number().min(-90).max(90), width:z.number().min(8).max(80), strength:z.number().min(0).max(100),
 light:z.number().min(40).max(140), density:z.number().min(20).max(90).default(55),
})
export type MaterialSettings=z.infer<typeof materialSettingsSchema>
export const defaultMaterialSettings:MaterialSettings={version:1,finish:'cat',color:'#861B37',angle:32,width:32,strength:72,light:90,density:55}
export const materialStorageKey='nail-material-study-v1'
export function parseMaterialSettings(raw:string|null):MaterialSettings{
 try{const result=materialSettingsSchema.safeParse(JSON.parse(raw||'null'));if(result.success)return result.data}catch{/* A damaged local study must not prevent opening the studio. */}
 return {...defaultMaterialSettings}
}

import {z} from 'zod'
export const surfaceSchema=z.object({
 shine:z.number().min(0).max(100).default(70),
 catStyle:z.enum(['ribbon','straight','diagonal','halo','velvet','french','cross','spot']).default('ribbon'),
 catWidth:z.number().min(8).max(80).default(28),
 catStrength:z.number().min(0).max(100).default(75),
 catPosition:z.number().min(-60).max(60).default(0),
 sparkle:z.number().min(0).max(100).default(40),
}).strict()
export const patternSettingsSchema=z.object({
 frenchStyle:z.enum(['smile','deep','diagonal','double']).default('smile'),
 curve:z.number().min(0).max(100).default(50),
 angle:z.number().min(-90).max(90).default(0),
 position:z.number().min(10).max(90).default(50),
 softness:z.number().min(5).max(100).default(65),
 gradientStyle:z.enum(['linear','aura']).default('linear'),
 dotsStyle:z.enum(['regular','scatter']).default('regular'),
 spacing:z.number().min(12).max(50).default(28),
 linesStyle:z.enum(['wave','straight']).default('wave'),
 lineCount:z.number().int().min(1).max(5).default(2),
 opacity:z.number().min(10).max(100).default(100),
}).strict()
export const defaultSurface=()=>surfaceSchema.parse({})
export const defaultPatternSettings=()=>patternSettingsSchema.parse({})

export const patternLayerSchema=z.object({
 id:z.string().min(1).max(64),
 type:z.enum(['french','gradient','dots','lines']),
 accent:z.string().regex(/^#[0-9a-fA-F]{6}$/),
 patternSize:z.number().min(8).max(50),
 settings:patternSettingsSchema.default(defaultPatternSettings),
 locked:z.boolean().default(false),
 drawMode:z.enum(['preset','free']).default('preset'),
 strokes:z.array(z.object({points:z.array(z.object({x:z.number().min(0).max(100),y:z.number().min(0).max(160)}).strict()).min(1).max(256)}).strict()).max(64).default([]),
}).strict()

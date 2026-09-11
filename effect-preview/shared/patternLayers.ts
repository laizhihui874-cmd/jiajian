import type {Nail,PatternLayer} from './design.js'
import {defaultPatternSettings} from './effects.js'

// Existing single-pattern documents remain readable until their first stack edit.
export function nailPatterns(n:Nail):PatternLayer[]{
 const legacy:PatternLayer[]=n.pattern==='none'?[]:[{id:'legacy-pattern',type:n.pattern,accent:n.accent,patternSize:n.patternSize,settings:{...defaultPatternSettings(),...n.patternSettings},locked:n.lockedLayers.includes('pattern'),drawMode:'preset',strokes:[]}]
 return [...legacy,...(n.patternLayers||[])]
}
export function patternPatch(layers:PatternLayer[]):Partial<Nail>{return {pattern:'none',patternLayers:layers}}

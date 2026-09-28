import { itemConfigs, type ItemId } from '../../config/items/items';
import { Random } from '../utils/Random';

export interface DropState {
  attackCores: number;
  rapidCores: number;
  critCores: number;
  electricStacks: number;
  missileLevel: number;
  missileOverdrive: number;
  shields: number;
  hpRatio: number;
  phoenixReady: boolean;
  recent: readonly ItemId[];
  elite?: boolean;
}

export function itemWeights(
  state: DropState,
): { value: ItemId; weight: number }[] {
  return (Object.keys(itemConfigs) as ItemId[]).map((value) => {
    const config = itemConfigs[value];
    let weight: number = config.weight;
    if (state.elite && config.rarity === 'Epic') weight *= 1.8;
    if (state.elite && config.rarity === 'Legendary') weight *= 2.5;
    if (state.recent.includes(value)) weight *= 0.35;
    if (value === 'attack_core' && state.attackCores >= 5) weight = 0;
    if (value === 'fire_rate_core' && state.rapidCores >= 5) weight = 0;
    if (value === 'critical_core' && state.critCores >= 5) weight = 0;
    if (value === 'electric_arc' && state.electricStacks >= 5) weight = 0;
    if (value === 'homing_missile' && state.missileLevel >= 5)
      weight *= state.missileOverdrive >= 3 ? 0 : 0.3;
    if (value === 'phoenix_core' && state.phoenixReady) weight *= 0.12;
    if (value === 'heal' && state.hpRatio < 0.3) weight *= 2.2;
    if (value === 'shield' && state.shields >= 4) weight *= 0.35;
    return { value, weight };
  });
}

export function rollItem(state: DropState): ItemId {
  return Random.weighted(itemWeights(state));
}

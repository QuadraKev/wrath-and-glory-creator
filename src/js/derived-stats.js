// Derived Stats Calculator - Calculates all derived character stats

const DerivedStats = {
    // Get background bonus for a specific stat type
    getBackgroundBonus(character, statType) {
        let bonus = 0;
        const background = character.background;

        if (background?.origin?.bonusType === statType) bonus += 1;
        if (background?.accomplishment?.bonusType === statType) bonus += 1;
        if (background?.goal?.bonusType === statType) bonus += 1;

        return bonus;
    },

    // Get species sub-option bonus for a specific stat
    getSpeciesSubOptionBonus(character, bonusKey) {
        const species = DataLoader.getSpecies(character.species?.id);
        if (!species?.subOptions || !character.species?.subOptions) return 0;

        const rank = character.rank || 1;
        let bonus = 0;

        const subOptionsConfig = Array.isArray(species.subOptions) ? species.subOptions : [species.subOptions];

        for (const config of subOptionsConfig) {
            for (const selectedOpt of character.species.subOptions || []) {
                if (selectedOpt.type === config.type) {
                    const option = config.options?.find(o => o.id === selectedOpt.optionId);
                    if (option?.bonuses) {
                        const bonusValue = option.bonuses[bonusKey];
                        if (bonusValue === 'rank') {
                            bonus += rank;
                        } else if (bonusValue === 'doubleRank') {
                            bonus += rank * 2;
                        } else if (typeof bonusValue === 'number') {
                            bonus += bonusValue;
                        }
                    }
                }
            }
        }

        return bonus;
    },

    // Get species sub-option skill bonus
    getSpeciesSubOptionSkillBonus(character, skillKey) {
        const species = DataLoader.getSpecies(character.species?.id);
        if (!species?.subOptions || !character.species?.subOptions) return 0;

        const rank = character.rank || 1;
        let bonus = 0;

        const subOptionsConfig = Array.isArray(species.subOptions) ? species.subOptions : [species.subOptions];

        for (const config of subOptionsConfig) {
            for (const selectedOpt of character.species.subOptions || []) {
                if (selectedOpt.type === config.type) {
                    const option = config.options?.find(o => o.id === selectedOpt.optionId);
                    if (option?.bonuses?.skills?.[skillKey]) {
                        const bonusValue = option.bonuses.skills[skillKey];
                        if (bonusValue === 'rank') {
                            bonus += rank;
                        } else if (bonusValue === 'doubleRank') {
                            bonus += rank * 2;
                        } else if (typeof bonusValue === 'number') {
                            bonus += bonusValue;
                        }
                    }
                }
            }
        }

        return bonus;
    },

    // Linked attributes for each skill
    SKILL_ATTRIBUTES: {
        athletics: 'strength',
        awareness: 'intellect',
        ballisticSkill: 'agility',
        cunning: 'fellowship',
        deception: 'fellowship',
        insight: 'fellowship',
        intimidation: 'willpower',
        investigation: 'intellect',
        leadership: 'willpower',
        medicae: 'intellect',
        persuasion: 'fellowship',
        pilot: 'agility',
        psychicMastery: 'willpower',
        scholar: 'intellect',
        stealth: 'agility',
        survival: 'willpower',
        tech: 'intellect',
        weaponSkill: 'initiative'
    },

    // Get linked attribute for a skill
    getLinkedAttribute(skillName) {
        return this.SKILL_ATTRIBUTES[skillName] || null;
    },

    // Calculate Defence (Initiative - 1)
    calculateDefence(character) {
        return Math.max(0, (character.attributes?.initiative || 1) - 1);
    },

    // Calculate Resilience (Toughness + 1 + Armor Rating + Species Sub-Option Bonus)
    calculateResilience(character, armorRating = 0) {
        const base = (character.attributes?.toughness || 1) + 1 + armorRating;
        const subOptionBonus = this.getSpeciesSubOptionBonus(character, 'resilience');
        return base + subOptionBonus;
    },

    // Calculate Determination (equal to Toughness + background bonus)
    calculateDetermination(character) {
        const base = character.attributes?.toughness || 1;
        const backgroundBonus = this.getBackgroundBonus(character, 'determination');
        return base + backgroundBonus;
    },

    // Calculate Max Wounds (Tier x 2 + Toughness + Species Bonus + Background Bonus)
    calculateMaxWounds(character) {
        const tier = character.tier || 1;
        const toughness = character.attributes?.toughness || 1;
        const species = DataLoader.getSpecies(character.species?.id);
        const speciesBonus = species?.woundBonus || 0;
        const backgroundBonus = this.getBackgroundBonus(character, 'maxWounds');

        return (tier * 2) + toughness + speciesBonus + backgroundBonus;
    },

    // Calculate Max Shock (Willpower + Tier + Background Bonus + Species Sub-Option Bonus)
    calculateMaxShock(character) {
        const tier = character.tier || 1;
        const willpower = character.attributes?.willpower || 1;
        const backgroundBonus = this.getBackgroundBonus(character, 'maxShock');
        const subOptionBonus = this.getSpeciesSubOptionBonus(character, 'maxShock');
        return willpower + tier + backgroundBonus + subOptionBonus;
    },

    // Get Speed from species
    calculateSpeed(character) {
        const species = DataLoader.getSpecies(character.species?.id);
        return species?.speed || 6;
    },

    // Calculate Conviction (equal to Willpower + Background Bonus)
    calculateConviction(character) {
        const base = character.attributes?.willpower || 1;
        const backgroundBonus = this.getBackgroundBonus(character, 'conviction');
        return base + backgroundBonus;
    },

    // Calculate Resolve (Willpower - 1 + Background Bonus)
    calculateResolve(character) {
        const base = Math.max(0, (character.attributes?.willpower || 1) - 1);
        const backgroundBonus = this.getBackgroundBonus(character, 'resolve');
        return base + backgroundBonus;
    },

    // Calculate Passive Awareness (ceiling of (Intellect + Awareness) / 2)
    calculatePassiveAwareness(character) {
        const intellect = character.attributes?.intellect || 1;
        const awareness = character.skills?.awareness || 0;
        return Math.ceil((intellect + awareness) / 2);
    },

    // Calculate Influence (Fellowship - 1 + Archetype Bonus + Background Bonus)
    calculateInfluence(character) {
        const fellowship = character.attributes?.fellowship || 1;
        const archetype = DataLoader.getArchetype(character.archetype?.id);
        const archetypeBonus = archetype?.influenceModifier || 0;
        const backgroundBonus = this.getBackgroundBonus(character, 'influence');
        return Math.max(0, fellowship - 1 + archetypeBonus + backgroundBonus);
    },

    // Calculate Wealth (equal to Tier + Background Bonus)
    calculateWealth(character) {
        const base = character.tier || 1;
        const backgroundBonus = this.getBackgroundBonus(character, 'wealth');
        return base + backgroundBonus;
    },

    // Get Corruption (tracked value, starts at 0)
    getCorruption(character) {
        return character.corruption || 0;
    },

    // Calculate skill total (Skill Rating + Linked Attribute + Species Sub-Option Bonus)
    calculateSkillTotal(character, skillName) {
        const skillRating = character.skills?.[skillName] || 0;
        const linkedAttr = this.SKILL_ATTRIBUTES[skillName];
        const attrValue = character.attributes?.[linkedAttr] || 1;
        const subOptionBonus = this.getSpeciesSubOptionSkillBonus(character, skillName);
        return skillRating + attrValue + subOptionBonus;
    },

    // Get skill bonus info for display (shows if there's a species sub-option bonus)
    getSkillBonusInfo(character, skillName) {
        const subOptionBonus = this.getSpeciesSubOptionSkillBonus(character, skillName);
        if (subOptionBonus > 0) {
            return { bonus: subOptionBonus, source: 'Path' };
        }
        return null;
    },

    // Get all derived stats as an object
    getAllDerivedStats(character, armorRating = 0) {
        return {
            defence: this.calculateDefence(character),
            resilience: this.calculateResilience(character, armorRating),
            determination: this.calculateDetermination(character),
            maxWounds: this.calculateMaxWounds(character),
            maxShock: this.calculateMaxShock(character),
            speed: this.calculateSpeed(character),
            conviction: this.calculateConviction(character),
            resolve: this.calculateResolve(character),
            passiveAwareness: this.calculatePassiveAwareness(character),
            influence: this.calculateInfluence(character),
            wealth: this.calculateWealth(character),
            corruption: this.getCorruption(character)
        };
    },

    // Calculate weapon damage
    calculateWeaponDamage(weapon, character) {
        if (!weapon) return null;

        let damage = weapon.damage?.base || 0;

        // Add bonus
        damage += weapon.damage?.bonus || 0;

        // Add attribute bonus (usually Strength for melee)
        if (weapon.damage?.attribute) {
            damage += character.attributes?.[weapon.damage.attribute] || 0;
        }

        // Check for talent bonuses to ED
        let ed = weapon.ed || 0;
        for (const talentId of character.talents || []) {
            const talent = DataLoader.getTalent(talentId);
            if (talent?.edBonus) {
                // Check if talent applies to this weapon
                if (this.talentAppliesToWeapon(talent, weapon)) {
                    ed += talent.edBonus;
                }
            }
        }

        return {
            damage: damage,
            ed: ed,
            ap: weapon.ap || 0,
            display: `${damage} + ${ed} ED`,
            displayWithAP: weapon.ap ? `${damage} + ${ed} ED, AP ${weapon.ap}` : `${damage} + ${ed} ED`
        };
    },

    // Check if a talent's bonus applies to a weapon
    talentAppliesToWeapon(talent, weapon) {
        if (!talent.appliesTo) return false;

        // Check weapon type
        if (talent.appliesTo.weaponType && talent.appliesTo.weaponType !== weapon.type) {
            return false;
        }

        // Check weapon traits
        if (talent.appliesTo.traits) {
            const weaponTraits = weapon.traits || [];
            const hasRequiredTrait = talent.appliesTo.traits.some(t =>
                weaponTraits.some(wt => wt.toLowerCase().includes(t.toLowerCase()))
            );
            if (!hasRequiredTrait) return false;
        }

        // Check weapon keywords
        if (talent.appliesTo.keywords) {
            const weaponKeywords = weapon.keywords || [];
            const hasRequiredKeyword = talent.appliesTo.keywords.some(k =>
                weaponKeywords.includes(k)
            );
            if (!hasRequiredKeyword) return false;
        }

        return true;
    },

    // Get total armor rating from equipped armor
    getTotalArmorRating(character) {
        let totalAR = 0;

        for (const item of character.wargear || []) {
            const armor = DataLoader.getArmor(item.id);
            if (armor) {
                totalAR += armor.ar || 0;
            }
        }

        return totalAR;
    },

    // Format attribute name for display
    formatAttributeName(attrKey) {
        const names = {
            strength: 'Strength',
            toughness: 'Toughness',
            agility: 'Agility',
            initiative: 'Initiative',
            willpower: 'Willpower',
            intellect: 'Intellect',
            fellowship: 'Fellowship'
        };
        return names[attrKey] || attrKey;
    },

    // Format skill name for display
    formatSkillName(skillKey) {
        const names = {
            athletics: 'Athletics',
            awareness: 'Awareness',
            ballisticSkill: 'Ballistic Skill',
            cunning: 'Cunning',
            deception: 'Deception',
            insight: 'Insight',
            intimidation: 'Intimidation',
            investigation: 'Investigation',
            leadership: 'Leadership',
            medicae: 'Medicae',
            persuasion: 'Persuasion',
            pilot: 'Pilot',
            psychicMastery: 'Psychic Mastery',
            scholar: 'Scholar',
            stealth: 'Stealth',
            survival: 'Survival',
            tech: 'Tech',
            weaponSkill: 'Weapon Skill'
        };
        return names[skillKey] || skillKey;
    },

    // Get abbreviated attribute name
    getAttributeAbbrev(attrKey) {
        const abbrevs = {
            strength: 'Str',
            toughness: 'Tou',
            agility: 'Agi',
            initiative: 'Ini',
            willpower: 'Wil',
            intellect: 'Int',
            fellowship: 'Fel'
        };
        return abbrevs[attrKey] || attrKey.substring(0, 3);
    }
};

// Archetype Tab - Archetype selection

const ArchetypeTab = {
    searchQuery: '',

    init() {
        // Search input
        document.getElementById('archetype-search').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderList();
        });
    },

    render() {
        const character = State.getCharacter();

        // If archetype is selected, show detail view
        if (character.archetype?.id) {
            this.renderDetail();
        } else {
            // Show the list and hide the detail
            document.getElementById('archetype-list').classList.remove('hidden');
            document.getElementById('archetype-detail').classList.add('hidden');
            this.renderList();
        }
    },

    renderList() {
        const container = document.getElementById('archetype-list');
        const character = State.getCharacter();
        const allArchetypes = DataLoader.getAllArchetypes();

        if (!allArchetypes || allArchetypes.length === 0) {
            container.innerHTML = '<p class="text-muted">No archetype data loaded.</p>';
            return;
        }

        // Filter archetypes
        const archetypes = allArchetypes.filter(a => {
            // Check source
            if (!State.isSourceEnabled(a.source)) return false;

            // Check tier
            if (a.tier > character.tier) return false;

            // Check species compatibility
            if (a.species && a.species.length > 0 && character.species?.id) {
                if (!a.species.includes(character.species.id)) return false;
            }

            // Check search query
            if (this.searchQuery) {
                const searchable = `${a.name} ${a.description} ${a.faction}`.toLowerCase();
                if (!searchable.includes(this.searchQuery)) return false;
            }

            return true;
        });

        // Group by faction
        const grouped = {};
        for (const a of archetypes) {
            const faction = a.faction || 'Other';
            if (!grouped[faction]) {
                grouped[faction] = [];
            }
            grouped[faction].push(a);
        }

        container.innerHTML = '';

        // Sort factions alphabetically
        const sortedFactions = Object.keys(grouped).sort();

        for (const faction of sortedFactions) {
            const group = document.createElement('div');
            group.className = 'archetype-group';

            const title = document.createElement('div');
            title.className = 'archetype-group-title';
            title.textContent = faction;
            group.appendChild(title);

            for (const archetype of grouped[faction]) {
                const isSelected = character.archetype?.id === archetype.id;

                const item = document.createElement('div');
                item.className = `archetype-item ${isSelected ? 'selected' : ''}`;
                item.innerHTML = `
                    <div class="archetype-info">
                        <div class="archetype-name">
                            ${archetype.name}
                            ${archetype.source !== 'core' ? `<span class="card-source">${archetype.source}</span>` : ''}
                        </div>
                        <div class="archetype-desc">${archetype.description || ''}</div>
                    </div>
                    <div class="archetype-stats">
                        <span class="archetype-xp">${archetype.cost} XP</span>
                        <span class="archetype-tier">Tier ${archetype.tier}</span>
                        <span>&#10095;</span>
                    </div>
                `;

                item.addEventListener('click', () => {
                    State.setArchetype(archetype.id);
                    this.renderDetail();
                });

                group.appendChild(item);
            }

            container.appendChild(group);
        }

        if (sortedFactions.length === 0) {
            container.innerHTML = '<p class="text-muted">No archetypes match your criteria. Try selecting a species or adjusting the tier.</p>';
        }
    },

    renderDetail() {
        const character = State.getCharacter();
        const archetype = DataLoader.getArchetype(character.archetype?.id);

        if (!archetype) {
            document.getElementById('archetype-detail').classList.add('hidden');
            document.getElementById('archetype-list').classList.remove('hidden');
            return;
        }

        const detail = document.getElementById('archetype-detail');
        document.getElementById('archetype-list').classList.add('hidden');

        const species = DataLoader.getSpecies(character.species?.id);

        // Calculate total XP cost (archetype + stats)
        let statsXP = 0;
        if (archetype.attributeBonus) {
            for (const [attr, val] of Object.entries(archetype.attributeBonus)) {
                statsXP += XPCalculator.ATTRIBUTE_COSTS[val] || 0;
            }
        }
        if (archetype.skillBonus) {
            for (const [skill, val] of Object.entries(archetype.skillBonus)) {
                statsXP += XPCalculator.SKILL_COSTS[val] || 0;
            }
        }

        detail.innerHTML = `
            <div class="detail-header">
                <div>
                    <h2 class="detail-title">${archetype.name}</h2>
                    <div class="detail-subtitle">${archetype.description || ''}</div>
                    <button class="btn-change" id="btn-change-archetype">CHANGE ARCHETYPE</button>
                </div>
            </div>

            <div class="detail-stats">
                <div class="detail-stat">
                    <span class="detail-stat-label">Tier:</span>
                    <span class="detail-stat-value">${archetype.tier}</span>
                </div>
                <div class="detail-stat">
                    <span class="detail-stat-label">Species:</span>
                    <span class="detail-stat-value">${species?.name || 'Any'}</span>
                </div>
                <div class="detail-stat">
                    <span class="detail-stat-label">XP Cost:</span>
                    <span class="detail-stat-value">${archetype.cost}, incl. Archetype (${archetype.cost} XP) and Stats (${statsXP} XP)</span>
                </div>
                <div class="detail-stat">
                    <span class="detail-stat-label">Attributes:</span>
                    <span class="detail-stat-value">${this.formatBonuses(archetype.attributeBonus, true)}</span>
                </div>
                <div class="detail-stat">
                    <span class="detail-stat-label">Skills:</span>
                    <span class="detail-stat-value">${this.formatBonuses(archetype.skillBonus, false)}</span>
                </div>
                <div class="detail-stat">
                    <span class="detail-stat-label">Influence Modifier:</span>
                    <span class="detail-stat-value">${archetype.influenceModifier > 0 ? '+' : ''}${archetype.influenceModifier || 0}</span>
                </div>
            </div>

            <div class="detail-keywords">
                ${(archetype.keywords || []).map(k => `<span class="keyword">${k}</span>`).join('')}
            </div>

            ${archetype.abilities && archetype.abilities.length > 0 ? `
                <div class="detail-section">
                    ${archetype.abilities.map(a => `
                        <div class="ability-item">
                            <div class="ability-name">${a.name}</div>
                            <div class="ability-desc">${a.description}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${archetype.startingWargear && archetype.startingWargear.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Wargear</div>
                    <div class="ability-desc">${this.formatWargear(archetype.startingWargear)}</div>
                </div>
            ` : ''}

            <div class="info-box" style="margin-top: 15px; padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-secondary);">
                &#9432; You can add your (starting) equipment in the 6. Wargear section.
            </div>
        `;

        // Change archetype button
        document.getElementById('btn-change-archetype').addEventListener('click', () => {
            detail.classList.add('hidden');
            document.getElementById('archetype-list').classList.remove('hidden');
            this.renderList();
        });

        // Enhance ability descriptions with glossary terms
        detail.querySelectorAll('.ability-desc').forEach(el => {
            Glossary.enhanceElement(el);
        });

        detail.classList.remove('hidden');
    },

    formatBonuses(bonuses, isAttribute) {
        if (!bonuses || Object.keys(bonuses).length === 0) {
            return '-';
        }

        const parts = [];
        for (const [key, value] of Object.entries(bonuses)) {
            const name = isAttribute
                ? DerivedStats.formatAttributeName(key)
                : DerivedStats.formatSkillName(key);
            parts.push(`${name} ${value}`);
        }

        return parts.join(', ');
    },

    formatWargear(wargearEntries) {
        const names = wargearEntries.map(entry => {
            // Handle both string IDs and object format { id: "...", qty: 3 }
            const id = typeof entry === 'string' ? entry : entry.id;
            const qty = typeof entry === 'object' && entry.qty > 1 ? entry.qty : null;
            const item = DataLoader.getWargearItem(id);
            const name = item?.name || id;
            return qty ? `${name} x${qty}` : name;
        });
        return names.join(', ');
    },

    refresh() {
        // Reset search query on refresh (e.g., when creating new character)
        this.searchQuery = '';
        const searchInput = document.getElementById('archetype-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.render();
    }
};

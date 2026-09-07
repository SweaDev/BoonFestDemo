import React, { useState, useEffect, useMemo } from 'react';
import {
  Hammer,
  Code,
  Sprout,
  Bike,
  Cpu,
  Briefcase,
  Compass,
  Brain,
  Activity,
  HeartHandshake,
  Sparkles,
  Shield,
  Flame,
  Leaf,
  Stethoscope,
  Droplets,
  Sun,
  Trees,
  Scale,
  Coins,
  Zap,
  Dices,
  Wine,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  Check,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Loader2,
  X,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CardCategory,
  CardManagementTab,
  CardPayload,
  GameCardCollections,
  Pillar,
  SlothArchetype,
  SlothCardDefinition,
} from '../types';

interface DevCardsManagementTabProps {
  currentUsername: string;
  onAddToast: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

// Icon dictionary for card visual rendering
export const CARD_ICON_COMPONENTS: Record<string, React.ElementType> = {
  Hammer,
  Code,
  Sprout,
  Bike,
  Cpu,
  Briefcase,
  Compass,
  Brain,
  Activity,
  HeartHandshake,
  Sparkles,
  Shield,
  Flame,
  Leaf,
  Stethoscope,
  Droplets,
  Sun,
  Trees,
  Scale,
  Coins,
  Zap,
  Dices,
  Wine,
};

export const AVAILABLE_ICONS = Object.keys(CARD_ICON_COMPONENTS);

type AnyCard = CardPayload | SlothCardDefinition;

// Category metadata
const CATEGORY_META: Record<
  CardManagementTab,
  {
    title: string;
    label: string;
    description: string;
    accentColor: string;
    badgeClass: string;
    borderClass: string;
    icon: React.ElementType;
    defaultIcon: string;
  }
> = {
  earn: {
    title: 'Earn Actions',
    label: 'Earn',
    description: 'Pro-social labor, craft, and civic work that yields financial credits.',
    accentColor: '#ffb800',
    badgeClass: 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/30',
    borderClass: 'border-[#ffb800]/40',
    icon: Coins,
    defaultIcon: 'Hammer',
  },
  grow: {
    title: 'Grow Disciplines',
    label: 'Grow',
    description: 'Personal cultivation cards upgrading Mind, Body, or Spirit pillars.',
    accentColor: '#00e5ff',
    badgeClass: 'bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30',
    borderClass: 'border-[#00e5ff]/40',
    icon: Sprout,
    defaultIcon: 'Brain',
  },
  boon: {
    title: 'Boon Fest Altruism',
    label: 'Boon',
    description: 'Civic contributions generating Altruism Score and restoring Green Hue.',
    accentColor: '#00ff95',
    badgeClass: 'bg-[#00ff95]/15 text-[#00ff95] border-[#00ff95]/30',
    borderClass: 'border-[#00ff95]/40',
    icon: Leaf,
    defaultIcon: 'HeartHandshake',
  },
  sloth: {
    title: 'Sloth Traps (Deceptive)',
    label: 'Sloth',
    description: 'Deceptive lottery & gambling cards disguised in hands that trigger latent societal entropy.',
    accentColor: '#a855f7',
    badgeClass: 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/30',
    borderClass: 'border-[#a855f7]/40',
    icon: Dices,
    defaultIcon: 'Sparkles',
  },
};

export const DevCardsManagementTab: React.FC<DevCardsManagementTabProps> = ({
  currentUsername,
  onAddToast,
}) => {
  const [activeTab, setActiveTab] = useState<CardManagementTab>('earn');
  const [collections, setCollections] = useState<GameCardCollections>({
    earn: [],
    grow: [],
    boon: [],
    sloth: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [archetypeFilter, setArchetypeFilter] = useState<'all' | 'lottery' | 'gambling'>('all');

  // Preview toggles per card id
  const [expandedPreviews, setExpandedPreviews] = useState<Record<string, boolean>>({});

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<AnyCard | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState<CardManagementTab>('earn');
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formTier, setFormTier] = useState<number>(1);
  const [formCost, setFormCost] = useState<number>(0);
  const [formIconName, setFormIconName] = useState('Hammer');
  const [formRewardDescription, setFormRewardDescription] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFlavor, setFormFlavor] = useState('');
  // Prerequisites
  const [prereqMind, setPrereqMind] = useState<number>(0);
  const [prereqBody, setPrereqBody] = useState<number>(0);
  const [prereqSpirit, setPrereqSpirit] = useState<number>(0);

  // Earn specific
  const [formCreditYield, setFormCreditYield] = useState<number>(45);

  // Grow specific
  const [formTargetPillar, setFormTargetPillar] = useState<Pillar>('mind');

  // Boon specific
  const [formBoonPoints, setFormBoonPoints] = useState<number>(100);
  const [formHueRecovery, setFormHueRecovery] = useState<number>(15);

  // Sloth specific
  const [formArchetype, setFormArchetype] = useState<SlothArchetype>('lottery');
  const [formDisguisedCategory, setFormDisguisedCategory] = useState<CardCategory>('earn');
  const [formEntropySpike, setFormEntropySpike] = useState<number>(16);
  const [formEntropyRateMultiplier, setFormEntropyRateMultiplier] = useState<number>(1.18);
  const [formPhantomCredits, setFormPhantomCredits] = useState<number>(0);
  const [formPhantomDurationSec, setFormPhantomDurationSec] = useState<number>(0);

  // Confirm delete modal
  const [cardToDelete, setCardToDelete] = useState<{ category: CardManagementTab; card: AnyCard } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirm reset modal
  const [resetModalCategory, setResetModalCategory] = useState<CardManagementTab | 'all' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch cards on mount
  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dev/cards?username=${encodeURIComponent(currentUsername)}`);
      const data = await res.json();
      if (res.ok && data.success && data.collections) {
        setCollections(data.collections);
      } else {
        onAddToast('error', data.error || 'Failed to load card pool.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Network error fetching cards.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [currentUsername]);

  // Open modal to create a new card
  const handleOpenCreateModal = (category: CardManagementTab) => {
    setIsCreatingNew(true);
    setEditingCard(null);
    setFormCategory(category);
    const uniqueSuffix = Date.now().toString().slice(-4);
    setFormId(`${category}_custom_${uniqueSuffix}`);
    setFormTitle('');
    setFormTier(category === 'sloth' ? 2 : 1);
    setFormCost(category === 'earn' ? 0 : category === 'grow' ? 40 : category === 'boon' ? 80 : 20);
    setFormIconName(CATEGORY_META[category].defaultIcon);
    setFormDescription('');
    setFormFlavor('');
    setPrereqMind(0);
    setPrereqBody(0);
    setPrereqSpirit(0);

    if (category === 'earn') {
      setFormCreditYield(45);
      setFormRewardDescription('+45 Credits');
    } else if (category === 'grow') {
      setFormTargetPillar('mind');
      setFormRewardDescription('+1 Mind Level');
    } else if (category === 'boon') {
      setFormBoonPoints(120);
      setFormHueRecovery(18);
      setFormRewardDescription('+120 Boon Pts, +18° Green');
    } else if (category === 'sloth') {
      setFormArchetype('lottery');
      setFormDisguisedCategory('earn');
      setFormEntropySpike(16);
      setFormEntropyRateMultiplier(1.18);
      setFormPhantomCredits(0);
      setFormPhantomDurationSec(0);
      setFormRewardDescription('Jackpot: Win up to 500 Credits!');
    }

    setIsEditorOpen(true);
  };

  // Open modal to edit existing card
  const handleOpenEditModal = (category: CardManagementTab, card: AnyCard) => {
    setIsCreatingNew(false);
    setEditingCard(card);
    setFormCategory(category);
    setFormId(card.id);
    setFormTitle(card.title);
    setFormTier(card.tier || 1);
    setFormCost(card.cost || 0);
    setFormIconName(card.iconName || 'Sparkles');
    setFormRewardDescription(card.rewardDescription || '');
    setFormDescription(card.description || '');
    setFormFlavor(card.flavor || '');

    setPrereqMind(card.prerequisites?.mind || 0);
    setPrereqBody(card.prerequisites?.body || 0);
    setPrereqSpirit(card.prerequisites?.spirit || 0);

    if (category === 'earn') {
      const earn = card as CardPayload;
      setFormCreditYield(earn.creditYield || 45);
    } else if (category === 'grow') {
      const grow = card as CardPayload;
      setFormTargetPillar(grow.targetPillar || 'mind');
    } else if (category === 'boon') {
      const boon = card as CardPayload;
      setFormBoonPoints(boon.boonPoints || 100);
      setFormHueRecovery(boon.hueRecovery || 15);
    } else if (category === 'sloth') {
      const sloth = card as SlothCardDefinition;
      setFormArchetype(sloth.archetype || 'lottery');
      setFormDisguisedCategory(sloth.disguisedCategory || 'earn');
      setFormEntropySpike(sloth.entropySpike || 16);
      setFormEntropyRateMultiplier(sloth.entropyRateMultiplier || 1.18);
      setFormPhantomCredits(sloth.phantomCredits || 0);
      setFormPhantomDurationSec(sloth.phantomDurationSec || 0);
    }

    setIsEditorOpen(true);
  };

  // Duplicate card
  const handleDuplicateCard = async (category: CardManagementTab, card: AnyCard) => {
    const cloneId = `${category}_copy_${Date.now().toString().slice(-6)}`;
    const clonedCard: any = {
      ...card,
      id: cloneId,
      title: `${card.title} (Copy)`,
    };

    setIsSaving(true);
    try {
      const res = await fetch('/api/dev/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          category,
          card: clonedCard,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.collections) {
        setCollections(data.collections);
        onAddToast('success', `Duplicated "${card.title}" as "${clonedCard.title}"!`);
      } else {
        onAddToast('error', data.error || 'Failed to duplicate card.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Server error duplicating card.');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-generate suggested reward description
  const handleAutoSuggestReward = () => {
    if (formCategory === 'earn') {
      const net = formCreditYield - formCost;
      setFormRewardDescription(
        net > 0 && formCost > 0
          ? `+${formCreditYield} Credits (Net +${net})`
          : `+${formCreditYield} Credits`
      );
    } else if (formCategory === 'grow') {
      const p = formTargetPillar.charAt(0).toUpperCase() + formTargetPillar.slice(1);
      setFormRewardDescription(`+1 ${p} Level`);
    } else if (formCategory === 'boon') {
      setFormRewardDescription(`+${formBoonPoints} Boon Pts, +${formHueRecovery}° Green`);
    } else if (formCategory === 'sloth') {
      if (formArchetype === 'lottery') {
        setFormRewardDescription('Jackpot: Win up to 500 Credits!');
      } else {
        setFormRewardDescription('High-Roller: Win up to 650 Credits!');
      }
    }
  };

  // Save Card Handler
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onAddToast('warning', 'Card title is required.');
      return;
    }

    const payload: any = {
      id: formId.trim() || `${formCategory}_${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      tier: Number(formTier) || 1,
      cost: Math.max(0, Number(formCost) || 0),
      rewardDescription: formRewardDescription.trim(),
      description: formDescription.trim(),
      flavor: formFlavor.trim(),
      iconName: formIconName,
    };

    // Prerequisites
    const prereqs: any = {};
    if (prereqMind > 0) prereqs.mind = prereqMind;
    if (prereqBody > 0) prereqs.body = prereqBody;
    if (prereqSpirit > 0) prereqs.spirit = prereqSpirit;
    if (Object.keys(prereqs).length > 0) {
      payload.prerequisites = prereqs;
    }

    // Category specifics
    if (formCategory === 'earn') {
      payload.creditYield = Math.max(1, Number(formCreditYield) || 45);
      if (!payload.rewardDescription) {
        payload.rewardDescription = `+${payload.creditYield} Credits`;
      }
    } else if (formCategory === 'grow') {
      payload.targetPillar = formTargetPillar;
      if (!payload.rewardDescription) {
        const p = formTargetPillar.charAt(0).toUpperCase() + formTargetPillar.slice(1);
        payload.rewardDescription = `+1 ${p} Level`;
      }
    } else if (formCategory === 'boon') {
      payload.boonPoints = Math.max(1, Number(formBoonPoints) || 100);
      payload.hueRecovery = Math.max(1, Number(formHueRecovery) || 15);
      if (!payload.rewardDescription) {
        payload.rewardDescription = `+${payload.boonPoints} Boon Pts, +${payload.hueRecovery}° Green`;
      }
    } else if (formCategory === 'sloth') {
      payload.archetype = formArchetype;
      payload.disguisedCategory = formDisguisedCategory;
      payload.entropySpike = Math.max(1, Number(formEntropySpike) || (formArchetype === 'gambling' ? 28 : 16));
      payload.entropyRateMultiplier = Math.max(1.01, Number(formEntropyRateMultiplier) || (formArchetype === 'gambling' ? 1.35 : 1.18));
      payload.phantomCredits = Math.max(0, Number(formPhantomCredits) || 0);
      payload.phantomDurationSec = Math.max(0, Number(formPhantomDurationSec) || 0);
      if (!payload.rewardDescription) {
        payload.rewardDescription =
          formArchetype === 'gambling'
            ? 'High-Roller: Win up to 650 Credits!'
            : 'Jackpot: Win up to 500 Credits!';
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/dev/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          category: formCategory,
          card: payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.collections) {
        setCollections(data.collections);
        setIsEditorOpen(false);
        onAddToast(
          'success',
          isCreatingNew
            ? `Created new card "${payload.title}"!`
            : `Updated card "${payload.title}"!`
        );
      } else {
        onAddToast('error', data.error || 'Failed to save card.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Server error saving card.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Card Handler
  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    const { category, card } = cardToDelete;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dev/cards/${category}/${encodeURIComponent(card.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.collections) {
        setCollections(data.collections);
        setCardToDelete(null);
        onAddToast('info', `Deleted "${card.title}" from ${category.toUpperCase()} pool.`);
      } else {
        onAddToast('error', data.error || 'Failed to delete card.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Server error deleting card.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset category/all handler
  const handleConfirmReset = async () => {
    if (!resetModalCategory) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/dev/cards/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          category: resetModalCategory === 'all' ? undefined : resetModalCategory,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.collections) {
        setCollections(data.collections);
        setResetModalCategory(null);
        onAddToast('success', data.message || 'Cards reset successfully.');
      } else {
        onAddToast('error', data.error || 'Failed to reset card pool.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Server error resetting cards.');
    } finally {
      setIsResetting(false);
    }
  };

  // Filter cards in current tab
  const currentPool = collections[activeTab] || [];
  const filteredCards = useMemo(() => {
    return currentPool.filter((card) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchDesc = card.description.toLowerCase().includes(q);
        const matchId = card.id.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId) return false;
      }

      // Tier filter
      if (tierFilter !== 'all') {
        if (card.tier !== Number(tierFilter)) return false;
      }

      // Archetype filter (sloth only)
      if (activeTab === 'sloth' && archetypeFilter !== 'all') {
        const sloth = card as SlothCardDefinition;
        if (sloth.archetype !== archetypeFilter) return false;
      }

      return true;
    });
  }, [currentPool, searchQuery, tierFilter, archetypeFilter, activeTab]);

  const togglePreview = (id: string) => {
    setExpandedPreviews((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00ff95]/10 flex items-center justify-center text-[#00ff95]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f0f2f5] flex items-center gap-2">
                Card Pool Management
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00ff95]/15 text-[#00ff95] border border-[#00ff95]/30">
                  Live Engine
                </span>
              </h3>
              <p className="text-xs text-[#8a8f98]">
                Add, modify, duplicate, or delete cards across all 4 core deck categories.
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreateModal(activeTab)}
            className="px-3 py-1.5 rounded-lg bg-[#00ff95] hover:bg-[#00e585] text-[#08090b] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#00ff95]/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add {CATEGORY_META[activeTab].label} Card</span>
          </button>

          <button
            onClick={() => setResetModalCategory(activeTab)}
            className="px-2.5 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] border border-[#22242a] text-[#8a8f98] hover:text-[#f0f2f5] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Reset current tab cards to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Tab</span>
          </button>
        </div>
      </div>

      {/* 4 Category Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['earn', 'grow', 'boon', 'sloth'] as CardManagementTab[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const count = collections[cat]?.length || 0;
          const isActive = activeTab === cat;

          return (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat);
                setSearchQuery('');
                setTierFilter('all');
                setArchetypeFilter('all');
              }}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                isActive
                  ? `bg-[#131418] ${meta.borderClass} shadow-md`
                  : 'bg-[#0c0d10] border-[#22242a] hover:border-[#333742]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                    style={{
                      backgroundColor: `${meta.accentColor}20`,
                      color: meta.accentColor,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#f0f2f5]">{meta.label}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${meta.badgeClass}`}>
                  {count} Cards
                </span>
              </div>
              <p className="text-[11px] text-[#8a8f98] line-clamp-1">{meta.description}</p>
            </button>
          );
        })}
      </div>

      {/* Sub-toolbar: Search & Filters */}
      <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#22242a] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#525866]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${CATEGORY_META[activeTab].label} cards...`}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] placeholder-[#525866] focus:outline-none focus:border-[#00ff95]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#f0f2f5]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1 bg-[#131418] p-1 rounded-lg border border-[#22242a]">
            {(['all', '1', '2', '3'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                  tierFilter === t
                    ? 'bg-[#1a1c22] text-[#00ff95] font-bold shadow-xs'
                    : 'text-[#8a8f98] hover:text-[#f0f2f5]'
                }`}
              >
                {t === 'all' ? 'All Tiers' : `T${t}`}
              </button>
            ))}
          </div>

          {/* Archetype filter for Sloth */}
          {activeTab === 'sloth' && (
            <div className="flex items-center gap-1 bg-[#131418] p-1 rounded-lg border border-[#22242a]">
              {(['all', 'lottery', 'gambling'] as const).map((arch) => (
                <button
                  key={arch}
                  onClick={() => setArchetypeFilter(arch)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer capitalize ${
                    archetypeFilter === arch
                      ? 'bg-[#1a1c22] text-[#a855f7] font-bold'
                      : 'text-[#8a8f98] hover:text-[#f0f2f5]'
                  }`}
                >
                  {arch}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-[11px] text-[#8a8f98] font-mono">
          Showing {filteredCards.length} of {currentPool.length} cards
        </div>
      </div>

      {/* Cards List Grid */}
      {isLoading ? (
        <div className="p-12 rounded-xl bg-[#0c0d10] border border-[#22242a] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#00ff95]" />
          <span className="text-xs text-[#8a8f98]">Loading card pool...</span>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#0c0d10] border border-[#22242a] text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#131418] flex items-center justify-center text-[#525866]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#f0f2f5]">No cards match your filter.</p>
            <p className="text-[11px] text-[#8a8f98] mt-1">
              Try adjusting your search query, clearing filters, or create a brand new card!
            </p>
          </div>
          <button
            onClick={() => handleOpenCreateModal(activeTab)}
            className="px-3 py-1.5 rounded-lg bg-[#00ff95] text-[#08090b] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New {CATEGORY_META[activeTab].label} Card</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCards.map((card) => {
            const IconComp = CARD_ICON_COMPONENTS[card.iconName] || Sparkles;
            const meta = CATEGORY_META[activeTab];
            const isSloth = activeTab === 'sloth';
            const sloth = isSloth ? (card as SlothCardDefinition) : null;
            const isPreviewExpanded = Boolean(expandedPreviews[card.id]);

            return (
              <div
                key={card.id}
                className="p-3.5 rounded-xl bg-[#0c0d10] border border-[#22242a] hover:border-[#333742] transition flex flex-col justify-between gap-3 shadow-sm group"
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${meta.accentColor}15`,
                          borderColor: `${meta.accentColor}30`,
                          color: meta.accentColor,
                        }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#f0f2f5] group-hover:text-[#00ff95] transition">
                          {card.title}
                        </h4>
                        <span className="text-[10px] font-mono text-[#525866] block">
                          ID: {card.id}
                        </span>
                      </div>
                    </div>

                    {/* Badges: Tier & Cost */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#131418] text-[#8a8f98] border border-[#22242a]">
                        T{card.tier}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          card.cost > 0
                            ? 'bg-[#ff3b5c]/10 text-[#ff3b5c] border border-[#ff3b5c]/30'
                            : 'bg-[#00ff95]/10 text-[#00ff95] border border-[#00ff95]/30'
                        }`}
                      >
                        {card.cost > 0 ? `${card.cost} Cr` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Reward Description Pill */}
                  <div className="p-2 rounded-lg bg-[#131418] border border-[#1f2229] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#8a8f98]">Reward:</span>
                    <span className="font-bold text-[#f0f2f5] text-[11px] text-right">
                      {card.rewardDescription || 'None'}
                    </span>
                  </div>

                  {/* Category-Specific Metrics Strip */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {activeTab === 'earn' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ffb800]/10 text-[#ffb800] border border-[#ffb800]/25">
                        Yield: +{(card as CardPayload).creditYield || 0} Cr
                      </span>
                    )}

                    {activeTab === 'grow' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/25 capitalize">
                        Target Pillar: {(card as CardPayload).targetPillar || 'Mind'} (+1)
                      </span>
                    )}

                    {activeTab === 'boon' && (
                      <>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00ff95]/10 text-[#00ff95] border border-[#00ff95]/25">
                          +{(card as CardPayload).boonPoints || 0} Pts
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00ff95]/10 text-[#00ff95] border border-[#00ff95]/25">
                          +{(card as CardPayload).hueRecovery || 0}° Green
                        </span>
                      </>
                    )}

                    {isSloth && sloth && (
                      <>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/30 capitalize">
                          {sloth.archetype}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ff3b5c]/15 text-[#ff3b5c] border border-[#ff3b5c]/30">
                          Spike: +{sloth.entropySpike}° Red
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ff3b5c]/15 text-[#ff3b5c] border border-[#ff3b5c]/30">
                          Decay: {sloth.entropyRateMultiplier}x
                        </span>
                      </>
                    )}

                    {/* Prerequisites */}
                    {card.prerequisites && (
                      <div className="flex items-center gap-1">
                        {card.prerequisites.mind ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1a1c22] text-[#8a8f98] border border-[#22242a]">
                            Mind {card.prerequisites.mind}+
                          </span>
                        ) : null}
                        {card.prerequisites.body ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1a1c22] text-[#8a8f98] border border-[#22242a]">
                            Body {card.prerequisites.body}+
                          </span>
                        ) : null}
                        {card.prerequisites.spirit ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1a1c22] text-[#8a8f98] border border-[#22242a]">
                            Spirit {card.prerequisites.spirit}+
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Description & Flavor */}
                  <p className="text-[11px] text-[#8a8f98] line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                  {card.flavor && (
                    <p className="text-[10px] text-[#525866] italic line-clamp-1">
                      "{card.flavor}"
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-[#1f2229] flex items-center justify-between gap-2">
                  <button
                    onClick={() => togglePreview(card.id)}
                    className="text-[11px] text-[#8a8f98] hover:text-[#f0f2f5] flex items-center gap-1 transition cursor-pointer"
                  >
                    {isPreviewExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{isPreviewExpanded ? 'Hide Preview' : 'In-Hand Preview'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicateCard(activeTab, card)}
                      disabled={isSaving}
                      className="p-1.5 rounded-lg bg-[#131418] hover:bg-[#1f2229] border border-[#22242a] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                      title="Duplicate card"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(activeTab, card)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#131418] hover:bg-[#1f2229] border border-[#22242a] text-[#f0f2f5] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-[#00ff95]" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setCardToDelete({ category: activeTab, card })}
                      className="p-1.5 rounded-lg bg-[#131418] hover:bg-[#ff3b5c]/10 border border-[#22242a] hover:border-[#ff3b5c]/30 text-[#8a8f98] hover:text-[#ff3b5c] transition cursor-pointer"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible In-Hand Appearance Mockup */}
                {isPreviewExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-[#1f2229] space-y-2"
                  >
                    <div className="text-[10px] uppercase font-bold text-[#525866] tracking-wider">
                      In-Game Player Card Rendering:
                    </div>

                    <div
                      className="p-4 rounded-xl border bg-gradient-to-b from-[#131418] to-[#0a0b0e] space-y-3 relative overflow-hidden"
                      style={{ borderColor: `${meta.accentColor}40` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: `${meta.accentColor}20`,
                              color: meta.accentColor,
                            }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#f0f2f5] block">
                              {card.title}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-[#8a8f98]">
                              Tier {card.tier} • {isSloth ? 'Deceptive' : meta.label}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-[#f0f2f5] block">
                            {card.cost > 0 ? `${card.cost} Cr` : 'Free'}
                          </span>
                          <span className="text-[9px] text-[#00ff95] font-bold">
                            {card.rewardDescription}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#8a8f98] leading-relaxed">
                        {card.description}
                      </p>

                      {card.flavor && (
                        <p className="text-[10px] text-[#525866] italic border-t border-[#1f2229] pt-2">
                          "{card.flavor}"
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT CARD MODAL                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl bg-[#0e0f13] border border-[#22242a] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[#22242a] flex items-center justify-between bg-[#131418]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: `${CATEGORY_META[formCategory].accentColor}20`,
                      color: CATEGORY_META[formCategory].accentColor,
                    }}
                  >
                    {React.createElement(CATEGORY_META[formCategory].icon, { className: 'w-4 h-4' })}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#f0f2f5]">
                      {isCreatingNew
                        ? `Add New ${CATEGORY_META[formCategory].label} Card`
                        : `Edit Card: ${formTitle || 'Untitled'}`}
                    </h3>
                    <p className="text-xs text-[#8a8f98]">
                      Configure card parameters, costs, rewards, and prerequisites
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: Split Form + Live Preview */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Side (7 cols) */}
                <form onSubmit={handleSaveCard} id="card-editor-form" className="lg:col-span-7 space-y-4">
                  {/* Category selector if creating new */}
                  {isCreatingNew && (
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Card Category
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['earn', 'grow', 'boon', 'sloth'] as CardManagementTab[]).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setFormCategory(cat);
                              handleOpenCreateModal(cat);
                            }}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-bold capitalize transition cursor-pointer ${
                              formCategory === cat
                                ? `${CATEGORY_META[cat].badgeClass} ${CATEGORY_META[cat].borderClass}`
                                : 'bg-[#131418] border-[#22242a] text-[#8a8f98]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Title & Unique ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Card Title <span className="text-[#ff3b5c]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g., Solar Microgrid Volunteer"
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] focus:outline-none focus:border-[#00ff95]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Card Identifier (ID)
                      </label>
                      <input
                        type="text"
                        value={formId}
                        onChange={(e) => setFormId(e.target.value)}
                        placeholder="e.g., earn_solar_volunteer"
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                      />
                    </div>
                  </div>

                  {/* Tier & Cost */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Tier Level (1 - 3)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setFormTier(t)}
                            className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                              formTier === t
                                ? 'bg-[#00ff95]/15 text-[#00ff95] border-[#00ff95]/40'
                                : 'bg-[#131418] border-[#22242a] text-[#8a8f98]'
                            }`}
                          >
                            Tier {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Cost (Credits)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formCost}
                        onChange={(e) => setFormCost(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                      />
                    </div>
                  </div>

                  {/* Icon Selector */}
                  <div>
                    <label className="text-[11px] font-bold text-[#8a8f98] block mb-1.5">
                      Card Icon ({formIconName})
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg bg-[#131418] border border-[#22242a]">
                      {AVAILABLE_ICONS.map((iconKey) => {
                        const IconComponent = CARD_ICON_COMPONENTS[iconKey];
                        const isSelected = formIconName === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={() => setFormIconName(iconKey)}
                            className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#00ff95]/20 text-[#00ff95] border-[#00ff95]/50'
                                : 'bg-[#0c0d10] border-[#22242a] text-[#8a8f98] hover:text-[#f0f2f5]'
                            }`}
                            title={iconKey}
                          >
                            <IconComponent className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CATEGORY SPECIFIC ATTRIBUTES */}
                  <div className="p-3.5 rounded-xl bg-[#131418] border border-[#22242a] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#f0f2f5] flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#00ff95]" />
                        {CATEGORY_META[formCategory].label} Attributes
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoSuggestReward}
                        className="text-[10px] text-[#00ff95] hover:underline cursor-pointer"
                      >
                        Auto-suggest Reward Text
                      </button>
                    </div>

                    {/* Earn attributes */}
                    {formCategory === 'earn' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                              Credit Yield (Payout)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formCreditYield}
                              onChange={(e) => setFormCreditYield(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                              Net Profit Projection
                            </label>
                            <div className="px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs font-mono">
                              <span className={formCreditYield - formCost >= 0 ? 'text-[#00ff95]' : 'text-[#ff3b5c]'}>
                                Net: {formCreditYield - formCost >= 0 ? '+' : ''}
                                {formCreditYield - formCost} Credits
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grow attributes */}
                    {formCategory === 'grow' && (
                      <div>
                        <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                          Target Pillar (+1 Level Boost)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['mind', 'body', 'spirit'] as Pillar[]).map((pil) => (
                            <button
                              key={pil}
                              type="button"
                              onClick={() => {
                                setFormTargetPillar(pil);
                                const p = pil.charAt(0).toUpperCase() + pil.slice(1);
                                setFormRewardDescription(`+1 ${p} Level`);
                              }}
                              className={`py-2 px-3 rounded-lg border text-xs font-bold capitalize transition cursor-pointer ${
                                formTargetPillar === pil
                                  ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/50'
                                  : 'bg-[#0c0d10] border-[#22242a] text-[#8a8f98]'
                              }`}
                            >
                              {pil}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Boon attributes */}
                    {formCategory === 'boon' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                            Boon Altruism Points
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formBoonPoints}
                            onChange={(e) => setFormBoonPoints(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                            Green Hue Recovery (Degrees)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={formHueRecovery}
                            onChange={(e) => setFormHueRecovery(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Sloth attributes */}
                    {formCategory === 'sloth' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                              Sloth Archetype
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(['lottery', 'gambling'] as SlothArchetype[]).map((arch) => (
                                <button
                                  key={arch}
                                  type="button"
                                  onClick={() => {
                                    setFormArchetype(arch);
                                    if (arch === 'lottery') {
                                      setFormEntropySpike(16);
                                      setFormEntropyRateMultiplier(1.18);
                                      setFormRewardDescription('Jackpot: Win up to 500 Credits!');
                                    } else {
                                      setFormEntropySpike(28);
                                      setFormEntropyRateMultiplier(1.35);
                                      setFormRewardDescription('High-Roller: Win up to 650 Credits!');
                                    }
                                  }}
                                  className={`py-1.5 rounded-lg border text-xs font-bold capitalize transition cursor-pointer ${
                                    formArchetype === arch
                                      ? 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/50'
                                      : 'bg-[#0c0d10] border-[#22242a] text-[#8a8f98]'
                                  }`}
                                >
                                  {arch}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                              Disguised As Category
                            </label>
                            <select
                              value={formDisguisedCategory}
                              onChange={(e) => setFormDisguisedCategory(e.target.value as CardCategory)}
                              className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] focus:outline-none focus:border-[#00ff95]"
                            >
                              <option value="earn">Earn Action</option>
                              <option value="grow">Grow Discipline</option>
                              <option value="boon">Boon Altruism</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                              Instant Entropy Spike (° Red)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={formEntropySpike}
                              onChange={(e) => setFormEntropySpike(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                              Sustained Decay Multiplier
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="1.0"
                              max="3.0"
                              value={formEntropyRateMultiplier}
                              onChange={(e) => setFormEntropyRateMultiplier(Math.max(1, parseFloat(e.target.value) || 1))}
                              className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reward Description Input */}
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Reward Display Text
                      </label>
                      <input
                        type="text"
                        value={formRewardDescription}
                        onChange={(e) => setFormRewardDescription(e.target.value)}
                        placeholder="e.g., +45 Credits"
                        className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] focus:outline-none focus:border-[#00ff95]"
                      />
                    </div>
                  </div>

                  {/* Prerequisites Section */}
                  <div className="p-3.5 rounded-xl bg-[#131418] border border-[#22242a] space-y-2">
                    <label className="text-xs font-bold text-[#f0f2f5] block">
                      Prerequisites (Minimum Pillar Levels to Enact)
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-[10px] text-[#8a8f98] block mb-1 font-mono">Mind</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={prereqMind}
                          onChange={(e) => setPrereqMind(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8a8f98] block mb-1 font-mono">Body</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={prereqBody}
                          onChange={(e) => setPrereqBody(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8a8f98] block mb-1 font-mono">Spirit</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={prereqSpirit}
                          onChange={(e) => setPrereqSpirit(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description & Flavor */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Primary Description
                      </label>
                      <textarea
                        rows={2}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Explain the card's action and impact..."
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] focus:outline-none focus:border-[#00ff95] resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Flavor Text (Italicized lore)
                      </label>
                      <textarea
                        rows={2}
                        value={formFlavor}
                        onChange={(e) => setFormFlavor(e.target.value)}
                        placeholder="Atmospheric quote or narrative context..."
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] italic focus:outline-none focus:border-[#00ff95] resize-none"
                      />
                    </div>
                  </div>
                </form>

                {/* Right Side: LIVE IN-GAME CARD PREVIEW (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="text-xs font-bold text-[#f0f2f5] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#00ff95]" />
                    <span>Real-Time In-Hand Rendering</span>
                  </div>

                  {/* Card Simulation Component */}
                  <div
                    className="p-5 rounded-2xl border bg-[#0a0b0e] space-y-4 shadow-xl relative overflow-hidden"
                    style={{ borderColor: `${CATEGORY_META[formCategory].accentColor}50` }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center border"
                          style={{
                            backgroundColor: `${CATEGORY_META[formCategory].accentColor}20`,
                            borderColor: `${CATEGORY_META[formCategory].accentColor}40`,
                            color: CATEGORY_META[formCategory].accentColor,
                          }}
                        >
                          {React.createElement(
                            CARD_ICON_COMPONENTS[formIconName] || Sparkles,
                            { className: 'w-5 h-5' }
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#f0f2f5]">
                            {formTitle || 'Untitled Card'}
                          </h4>
                          <span className="text-[10px] text-[#8a8f98] font-bold uppercase tracking-wider">
                            Tier {formTier} • {CATEGORY_META[formCategory].label}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            formCost > 0
                              ? 'bg-[#ff3b5c]/15 text-[#ff3b5c] border border-[#ff3b5c]/30'
                              : 'bg-[#00ff95]/15 text-[#00ff95] border border-[#00ff95]/30'
                          }`}
                        >
                          {formCost > 0 ? `${formCost} Cr` : 'Free'}
                        </span>
                      </div>
                    </div>

                    {/* Reward Badge */}
                    <div className="p-2.5 rounded-xl bg-[#131418] border border-[#22242a] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#8a8f98]">Projected Reward:</span>
                      <span className="font-bold text-[#00ff95] text-xs">
                        {formRewardDescription || 'Pending input'}
                      </span>
                    </div>

                    {/* Prerequisites Pills */}
                    {(prereqMind > 0 || prereqBody > 0 || prereqSpirit > 0) && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-[#8a8f98]">Prereqs:</span>
                        {prereqMind > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1a1c22] text-[#8a8f98] border border-[#22242a]">
                            Mind {prereqMind}
                          </span>
                        )}
                        {prereqBody > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1a1c22] text-[#8a8f98] border border-[#22242a]">
                            Body {prereqBody}
                          </span>
                        )}
                        {prereqSpirit > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1a1c22] text-[#8a8f98] border border-[#22242a]">
                            Spirit {prereqSpirit}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-xs text-[#8a8f98] leading-relaxed">
                      {formDescription || 'Card description will appear here...'}
                    </p>

                    {/* Flavor */}
                    {formFlavor && (
                      <p className="text-[11px] text-[#525866] italic border-t border-[#1f2229] pt-2">
                        "{formFlavor}"
                      </p>
                    )}

                    {/* Deceptive Sloth Overlay Warning */}
                    {formCategory === 'sloth' && (
                      <div className="p-3 rounded-xl bg-[#ff3b5c]/10 border border-[#ff3b5c]/30 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff3b5c] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Dev Hidden Sloth Payload
                        </span>
                        <p className="text-[10px] text-[#ff8095]">
                          Player sees this disguised as an "{formDisguisedCategory.toUpperCase()}" action. When enacted, it triggers a +{formEntropySpike}° Red entropy spike and accelerates decay rate by {formEntropyRateMultiplier}x!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#22242a] bg-[#131418] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1a1c22] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="card-editor-form"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#00ff95] hover:bg-[#00e585] text-[#08090b] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Card...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isCreatingNew ? 'Create Card' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG                                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {cardToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e0f13] border border-[#ff3b5c]/40 rounded-2xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff3b5c]/10 text-[#ff3b5c] flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f0f2f5]">Delete Card Confirmation</h3>
                  <p className="text-xs text-[#8a8f98]">Are you sure you want to remove this card?</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#131418] border border-[#22242a] space-y-1">
                <span className="text-xs font-bold text-[#f0f2f5] block">
                  {cardToDelete.card.title}
                </span>
                <span className="text-[10px] font-mono text-[#8a8f98] block">
                  Category: {cardToDelete.category.toUpperCase()} • ID: {cardToDelete.card.id}
                </span>
              </div>

              <p className="text-xs text-[#8a8f98]">
                This will immediately remove the card from all future session draws.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCardToDelete(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] text-[#8a8f98] text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 rounded-lg bg-[#ff3b5c] hover:bg-[#e0304f] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* RESET TO DEFAULTS CONFIRMATION DIALOG                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {resetModalCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e0f13] border border-[#ffb800]/40 rounded-2xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffb800]/10 text-[#ffb800] flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f0f2f5]">Reset to Factory Defaults</h3>
                  <p className="text-xs text-[#8a8f98]">
                    {resetModalCategory === 'all'
                      ? 'Reset all 4 card categories to base factory cards.'
                      : `Reset ${resetModalCategory.toUpperCase()} cards to base templates.`}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#8a8f98]">
                Any custom cards or modifications in this category will be reverted to the factory preset deck.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalCategory(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] text-[#8a8f98] text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleConfirmReset}
                  className="px-4 py-1.5 rounded-lg bg-[#ffb800] hover:bg-[#e6a600] text-[#08090b] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Confirm Reset</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

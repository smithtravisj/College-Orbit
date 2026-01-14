'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Trash2, Edit2, ShoppingCart, Heart, Package, Check, Copy } from 'lucide-react';
import {
  ShoppingListType,
  ShoppingItem,
  GROCERY_CATEGORIES,
  WISHLIST_CATEGORIES,
  PANTRY_CATEGORIES,
} from '@/types';

const TAB_ORDER: ShoppingListType[] = ['pantry', 'grocery', 'wishlist'];

const TAB_CONFIG: Record<ShoppingListType, { label: string; icon: typeof ShoppingCart; categories: readonly string[] }> = {
  pantry: { label: 'Pantry', icon: Package, categories: PANTRY_CATEGORIES },
  grocery: { label: 'Grocery List', icon: ShoppingCart, categories: GROCERY_CATEGORIES },
  wishlist: { label: 'Wishlist', icon: Heart, categories: WISHLIST_CATEGORIES },
};

const STORAGE_KEY = 'shopping-active-tab';

export default function ShoppingPage() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ShoppingListType>(() => {
    // Initialize from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && TAB_ORDER.includes(saved as ShoppingListType)) {
        return saved as ShoppingListType;
      }
    }
    return 'pantry';
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [perishableFilter, setPerishableFilter] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '' as string | number,
    unit: '',
    category: '',
    notes: '',
    priority: '' as '' | 'low' | 'medium' | 'high',
    price: '',
    perishable: false,
  });

  const {
    shoppingItems,
    settings,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    toggleShoppingItemChecked,
    clearCheckedShoppingItems,
    initializeStore,
  } = useAppStore();

  // Handle filters card collapse state changes and save to database
  const handleFiltersCollapseChange = (isOpen: boolean) => {
    const currentCollapsed = settings.dashboardCardsCollapsedState || [];
    const newCollapsed = isOpen
      ? currentCollapsed.filter(id => id !== 'shopping-filters')
      : [...currentCollapsed, 'shopping-filters'];

    useAppStore.setState((state) => ({
      settings: {
        ...state.settings,
        dashboardCardsCollapsedState: newCollapsed,
      },
    }));

    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardCardsCollapsedState: newCollapsed }),
    }).catch(err => console.error('[Shopping] Failed to save filters collapse state:', err));
  };

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, activeTab);
    }
  }, [activeTab, mounted]);

  // Reset form when tab changes
  useEffect(() => {
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      category: '',
      notes: '',
      priority: '',
      price: '',
      perishable: false,
    });
    setCategoryFilter('');
    setPerishableFilter('');
    setShowForm(false);
    setEditingId(null);
  }, [activeTab]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const currentCategories = TAB_CONFIG[activeTab].categories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const quantity = typeof formData.quantity === 'string'
      ? (formData.quantity ? parseInt(formData.quantity, 10) : 1)
      : (formData.quantity || 1);

    const itemData = {
      listType: activeTab,
      name: formData.name.trim(),
      quantity,
      unit: formData.unit || null,
      category: formData.category || 'Other',
      notes: formData.notes,
      checked: false,
      priority: (formData.priority || null) as 'low' | 'medium' | 'high' | null,
      price: formData.price ? parseFloat(formData.price) : null,
      perishable: activeTab === 'pantry' ? formData.perishable : null,
    };

    if (editingId) {
      await updateShoppingItem(editingId, itemData);
      setEditingId(null);
    } else {
      await addShoppingItem(itemData);
    }

    resetForm();
    setShowForm(false);
  };

  const startEdit = (item: ShoppingItem) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(item.id);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || '',
      category: item.category,
      notes: item.notes,
      priority: item.priority || '',
      price: item.price?.toString() || '',
      perishable: item.perishable || false,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      category: '',
      notes: '',
      priority: '',
      price: '',
      perishable: false,
    });
  };

  // Filter items for current tab
  const filteredItems = shoppingItems
    .filter((item) => item.listType === activeTab)
    .filter((item) => !categoryFilter || item.category === categoryFilter)
    .filter((item) => {
      if (!perishableFilter) return true;
      if (perishableFilter === 'perishable') return item.perishable === true;
      if (perishableFilter === 'non-perishable') return !item.perishable;
      return true;
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.notes.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Unchecked first, then by creation date
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const checkedCount = filteredItems.filter((i) => i.checked).length;
  const TabIcon = TAB_CONFIG[activeTab].icon;

  const copyAllToClipboard = () => {
    // Use filteredItems instead of all pantry items to respect current filters
    const itemsToCopy = filteredItems;

    // Group by category
    const grouped: Record<string, typeof itemsToCopy> = {};
    itemsToCopy.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    // Sort categories
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      const aIndex = currentCategories.indexOf(a);
      const bIndex = currentCategories.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    const text = sortedCategories
      .map((category) => {
        const items = grouped[category]
          .map((item) => {
            let line = `  ${item.name} x${item.quantity}${item.unit ? ` ${item.unit}` : ''}`;
            if (item.perishable) {
              line += ` (perishable)`;
            }
            if (item.notes) {
              line += ` - ${item.notes}`;
            }
            return line;
          })
          .join('\n');
        return `${category}\n${items}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtersContent = (
    <>
      <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
        <Input
          label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
        />
      </div>
      <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
        <Select
          label="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: '', label: 'All Categories' },
            ...currentCategories.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>
      {activeTab === 'pantry' && (
        <div style={{ marginBottom: checkedCount > 0 ? (isMobile ? '12px' : '20px') : 0 }}>
          <Select
            label="Perishable"
            value={perishableFilter}
            onChange={(e) => setPerishableFilter(e.target.value)}
            options={[
              { value: '', label: 'All Items' },
              { value: 'perishable', label: 'Perishable Only' },
              { value: 'non-perishable', label: 'Non-Perishable Only' },
            ]}
          />
        </div>
      )}
      {checkedCount > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => clearCheckedShoppingItems(activeTab)}
        >
          <Trash2 size={14} />
          <span style={{ marginLeft: '6px' }}>Clear {checkedCount} checked</span>
        </Button>
      )}
    </>
  );

  return (
    <>
      <PageHeader
        title="Things to Buy"
        subtitle="Manage your shopping lists and pantry inventory"
        actions={
          <Button variant="secondary" size="md" onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (editingId || !showForm) {
                setEditingId(null);
                setFormData({
                  name: '',
                  quantity: '',
                  unit: '',
                  category: categoryFilter || '',
                  notes: '',
                  priority: '',
                  price: '',
                  perishable: perishableFilter === 'perishable' ? true : perishableFilter === 'non-perishable' ? false : false,
                });
                setShowForm(true);
              } else {
                setShowForm(false);
              }
            }}>
            <Plus size={18} />
            <span style={{ marginLeft: '6px' }}>Add Item</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)' }}>
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4" style={{ marginBottom: isMobile ? '12px' : '20px' }}>
          {TAB_ORDER.map((tab) => {
            const Icon = TAB_CONFIG[tab].icon;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex items-center gap-2 rounded-lg font-medium transition-colors"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  fontSize: isMobile ? '12px' : '14px',
                  backgroundColor: isActive ? 'var(--button-secondary)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                <Icon size={isMobile ? 14 : 16} />
                {TAB_CONFIG[tab].label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-[var(--grid-gap)]">
          {/* Sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content', position: isMobile ? 'static' : 'sticky', top: isMobile ? undefined : '107px', alignSelf: 'start', marginBottom: isMobile ? '8px' : undefined }}>
            {isMobile ? (
              <CollapsibleCard
                id="shopping-filters"
                title="Filters"
                initialOpen={!(settings.dashboardCardsCollapsedState || []).includes('shopping-filters')}
                onChange={handleFiltersCollapseChange}
              >
                {filtersContent}
              </CollapsibleCard>
            ) : (
              <Card>
                <h3 className="text-lg font-semibold text-[var(--text)]" style={{ marginBottom: '16px' }}>
                  Filters
                </h3>
                {filtersContent}
              </Card>
            )}
          </div>

          {/* Main Content - 9 columns */}
          <div className="col-span-12 lg:col-span-9" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '24px' }}>
            {/* Add Item Form */}
            {showForm && (
              <Card>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '16px' }}>
                  <Input
                    label="Item Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={
                      activeTab === 'pantry' ? 'What item do you have?' :
                      activeTab === 'wishlist' ? 'What do you want?' :
                      'What do you need?'
                    }
                    required
                  />

                  <div className={isMobile ? 'grid grid-cols-3' : 'grid grid-cols-3'} style={{ gap: isMobile ? '8px' : '16px' }}>
                    <Input
                      label="Quantity"
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                      placeholder="1"
                    />
                    <Input
                      label="Unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="lbs, oz..."
                    />
                    <Select
                      label="Category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      options={[
                        { value: '', label: 'Select category' },
                        ...currentCategories.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </div>

                  {/* Wishlist-specific fields */}
                  {activeTab === 'wishlist' && (
                    <div className={isMobile ? 'grid grid-cols-2' : 'grid grid-cols-2'} style={{ gap: isMobile ? '8px' : '16px' }}>
                      <Select
                        label="Priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        options={[
                          { value: '', label: 'No priority' },
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' },
                        ]}
                      />
                      <Input
                        label="Estimated Price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="$0.00"
                      />
                    </div>
                  )}

                  {/* Notes and Perishable row for pantry on mobile */}
                  {isMobile && activeTab === 'pantry' ? (
                    <div className="grid grid-cols-2 gap-2" style={{ alignItems: 'end' }}>
                      <Textarea
                        label="Notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Storage, expiration..."
                        autoExpand
                        maxHeight={200}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', height: 'var(--input-height)' }}>
                        <input
                          type="checkbox"
                          checked={formData.perishable}
                          onChange={(e) => setFormData({ ...formData, perishable: e.target.checked })}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--text)' }}>Perishable</span>
                      </label>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        label="Notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder={
                          activeTab === 'pantry' ? 'Storage location, expiration date, etc.' :
                          activeTab === 'wishlist' ? 'Where to buy, links, notes...' :
                          'Brand preferences, store location, etc.'
                        }
                        autoExpand
                        maxHeight={200}
                      />

                      {/* Pantry-specific fields - desktop only */}
                      {activeTab === 'pantry' && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.perishable}
                            onChange={(e) => setFormData({ ...formData, perishable: e.target.checked })}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px', color: 'var(--text)' }}>Perishable</span>
                        </label>
                      )}
                    </>
                  )}

                  <div className="flex gap-3" style={{ marginTop: isMobile ? '4px' : '4px' }}>
                    <Button variant="primary" type="submit" size={isMobile ? 'sm' : 'md'}>
                      {editingId ? 'Save Changes' : 'Add Item'}
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      size={isMobile ? 'sm' : 'md'}
                      onClick={() => { resetForm(); setShowForm(false); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Item List */}
            {filteredItems.length > 0 ? (
              <Card>
                {activeTab === 'pantry' && (
                  <div style={{ marginBottom: '8px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copyAllToClipboard}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span style={{ marginLeft: '6px' }}>{copied ? 'Copied!' : 'Copy All'}</span>
                    </Button>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(() => {
                    // Group items by category, maintaining category order
                    const groupedItems: Record<string, ShoppingItem[]> = {};
                    filteredItems.forEach((item) => {
                      if (!groupedItems[item.category]) {
                        groupedItems[item.category] = [];
                      }
                      groupedItems[item.category].push(item);
                    });

                    // Sort categories by their order in the category list
                    const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
                      const aIndex = currentCategories.indexOf(a);
                      const bIndex = currentCategories.indexOf(b);
                      // Put unknown categories at the end
                      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                      if (aIndex === -1) return 1;
                      if (bIndex === -1) return -1;
                      return aIndex - bIndex;
                    });

                    return sortedCategories.map((category, catIndex) => (
                      <div key={category}>
                        {/* Category heading */}
                        <div
                          style={{
                            padding: isMobile ? '12px 8px 8px' : '16px 16px 10px',
                            fontSize: isMobile ? '12px' : '13px',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderTop: catIndex > 0 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          {category}
                        </div>
                        {/* Items in this category */}
                        {groupedItems[category].map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center group hover:bg-[var(--panel-2)] rounded transition-colors"
                            style={{
                              padding: isMobile ? '10px 8px' : '12px 16px',
                              opacity: (item.checked && activeTab !== 'pantry') ? 0.6 : 1,
                              borderBottom: index < groupedItems[category].length - 1 ? '1px solid var(--border)' : 'none',
                              cursor: activeTab === 'pantry' ? 'pointer' : 'default',
                            }}
                            onClick={activeTab === 'pantry' ? () => startEdit(item) : undefined}
                          >
                            {/* Checkbox - hidden for pantry, replaced with spacing */}
                            {activeTab !== 'pantry' ? (
                              <button
                                onClick={() => toggleShoppingItemChecked(item.id)}
                                style={{
                                  width: isMobile ? '20px' : '24px',
                                  height: isMobile ? '20px' : '24px',
                                  border: item.checked ? 'none' : '2px solid var(--border)',
                                  borderRadius: '6px',
                                  backgroundColor: item.checked ? 'var(--accent)' : 'transparent',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  marginRight: isMobile ? '10px' : '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {item.checked && <Check size={14} color="white" strokeWidth={3} />}
                              </button>
                            ) : (
                              <div style={{ width: isMobile ? '12px' : '18px', flexShrink: 0 }} />
                            )}

                            {/* Item details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-medium ${(item.checked && activeTab !== 'pantry') ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}
                                  style={{ fontSize: isMobile ? '13px' : '14px' }}
                                >
                                  {item.name}
                                </span>
                                {(activeTab !== 'wishlist' || item.quantity > 1) && (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    x{item.quantity} {item.unit}
                                  </span>
                                )}
                                {item.priority && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: item.priority === 'high' ? 'rgba(220,38,38,0.1)' :
                                        item.priority === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                                      color: item.priority === 'high' ? 'var(--danger)' :
                                        item.priority === 'medium' ? '#eab308' : '#22c55e',
                                    }}
                                  >
                                    {item.priority}
                                  </span>
                                )}
                                {item.perishable && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(249,115,22,0.15)',
                                      color: '#f97316',
                                    }}
                                  >
                                    perishable
                                  </span>
                                )}
                              </div>
                              {item.price && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  ${item.price.toFixed(2)}
                                </div>
                              )}
                              {item.notes && (
                                <div style={{
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  marginTop: '2px',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}>
                                  {item.notes}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2" style={{ opacity: isMobile ? 1 : 0, transition: 'opacity 0.2s' }}>
                              <button
                                onClick={() => startEdit(item)}
                                className="text-[var(--text-muted)] hover:text-[var(--edit-hover)]"
                                style={{ padding: '4px' }}
                                aria-label="Edit item"
                              >
                                <Edit2 size={isMobile ? 16 : 18} />
                              </button>
                              <button
                                onClick={() => deleteShoppingItem(item.id)}
                                className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                                style={{ padding: '4px' }}
                                aria-label="Delete item"
                              >
                                <Trash2 size={isMobile ? 16 : 18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={<TabIcon size={24} />}
                title={`No ${TAB_CONFIG[activeTab].label.toLowerCase()} items`}
                description={`Add your first item to your ${TAB_CONFIG[activeTab].label.toLowerCase()}`}
                action={{ label: 'Add Item', onClick: () => setShowForm(true) }}
              />
            )}
          </div>
        </div>
      </div>

      {/* CSS for hover effects */}
      <style jsx>{`
        .group:hover .flex.items-center.gap-2 {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}

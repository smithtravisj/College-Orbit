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
import { Plus, Trash2, Edit2, ShoppingCart, Heart, Package, Check } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: '',
    category: '',
    notes: '',
    priority: '' as '' | 'low' | 'medium' | 'high',
    price: '',
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
      quantity: 1,
      unit: '',
      category: '',
      notes: '',
      priority: '',
      price: '',
    });
    setCategoryFilter('');
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

    const itemData = {
      listType: activeTab,
      name: formData.name.trim(),
      quantity: formData.quantity || 1,
      unit: formData.unit || null,
      category: formData.category || 'Other',
      notes: formData.notes,
      checked: false,
      priority: (formData.priority || null) as 'low' | 'medium' | 'high' | null,
      price: formData.price ? parseFloat(formData.price) : null,
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
    setEditingId(item.id);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || '',
      category: item.category,
      notes: item.notes,
      priority: item.priority || '',
      price: item.price?.toString() || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      quantity: 1,
      unit: '',
      category: '',
      notes: '',
      priority: '',
      price: '',
    });
  };

  // Filter items for current tab
  const filteredItems = shoppingItems
    .filter((item) => item.listType === activeTab)
    .filter((item) => !categoryFilter || item.category === categoryFilter)
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
          <Button variant="secondary" size="md" onClick={() => { resetForm(); setShowForm(!showForm); }}>
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
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content' }}>
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
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
                  <Input
                    label="Item Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="What do you need?"
                    required
                  />

                  <div className={isMobile ? 'flex flex-col' : 'grid grid-cols-3'} style={{ gap: isMobile ? '12px' : '16px' }}>
                    <Input
                      label="Quantity"
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    />
                    <Input
                      label="Unit (optional)"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="lbs, oz, each..."
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
                    <div className={isMobile ? 'flex flex-col' : 'grid grid-cols-2'} style={{ gap: isMobile ? '12px' : '16px' }}>
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

                  <Textarea
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Brand preferences, store location, etc."
                  />

                  <div className="flex gap-3" style={{ marginTop: '4px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center group hover:bg-[var(--panel-2)] rounded transition-colors"
                      style={{
                        padding: isMobile ? '10px 8px' : '12px 16px',
                        opacity: item.checked ? 0.6 : 1,
                        borderBottom: index < filteredItems.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {/* Checkbox */}
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

                      {/* Item details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-medium ${item.checked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}
                            style={{ fontSize: isMobile ? '13px' : '14px' }}
                          >
                            {item.name}
                          </span>
                          {item.quantity > 1 && (
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
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.category}
                          {item.price && ` - $${item.price.toFixed(2)}`}
                        </div>
                        {item.notes && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2" style={{ opacity: isMobile ? 1 : 0, transition: 'opacity 0.2s' }}>
                        <button
                          onClick={() => startEdit(item)}
                          className="text-[var(--text-muted)] hover:text-[var(--accent)]"
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

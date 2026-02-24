'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '@/hooks/useMediaQuery';

import useAppStore from '@/lib/store';
import { categorizeItem } from '@/lib/shoppingUtils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import {
  Plus, Trash2, Edit2, BookOpen, Search, X, Clock, Users,
  ShoppingCart, Star, Sparkles, ArrowLeft,
  ExternalLink, Camera, ImageIcon,
} from 'lucide-react';
import { Recipe, RecipeStep, RECIPE_TAG_SUGGESTIONS } from '@/types';

type ViewMode = 'list' | 'detail' | 'form';

interface IngredientFormData {
  name: string;
  quantity: string;
  unit: string;
  notes: string;
  category: string;
}

interface StepGroupFormData {
  title: string;
  ingredientIndices: number[]; // indices into the flat ingredients array
  instructions: string[];
}

const EMPTY_INGREDIENT: IngredientFormData = { name: '', quantity: '', unit: '', notes: '', category: '' };
const EMPTY_STEP_GROUP: StepGroupFormData = { title: '', ingredientIndices: [], instructions: [''] };

const INGREDIENT_CATEGORIES = [
  'Produce', 'Meat & Seafood', 'Dairy', 'Spices & Seasonings',
  'Canned Goods', 'Pasta & Rice', 'Baking Supplies', 'Condiments',
  'Bread', 'Frozen', 'Beverages', 'Oils & Cooking Sprays', 'Other',
] as const;

export default function RecipesTab() {
  const isMobile = useIsMobile();
  const addShoppingItem = useAppStore((s) => s.addShoppingItem);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingToGrocery, setAddingToGrocery] = useState(false);
  const [groceryAdded, setGroceryAdded] = useState(false);

  // AI extraction
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiPrefilled, setAiPrefilled] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    servings: '',
    prepTime: '',
    cookTime: '',
    instructions: '',
    sourceUrl: '',
    imageUrl: '',
    tags: [] as string[],
    isFavorite: false,
  });
  const [ingredients, setIngredients] = useState<IngredientFormData[]>([{ ...EMPTY_INGREDIENT }]);
  const [stepGroups, setStepGroups] = useState<StepGroupFormData[]>([{ ...EMPTY_STEP_GROUP }]);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ recipeId: string; x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleContextMenu = (e: React.MouseEvent, recipeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 180;
    const menuHeight = 84;
    const padding = 8;
    let x = e.clientX;
    let y = e.clientY;
    if (x + menuWidth + padding > window.innerWidth) x = window.innerWidth - menuWidth - padding;
    if (y + menuHeight + padding > window.innerHeight) y = window.innerHeight - menuHeight - padding;
    if (x < padding) x = padding;
    if (y < padding) y = padding;
    setContextMenu({ recipeId, x, y });
  };

  // Image upload
  const imageInputRef = useRef<HTMLInputElement>(null);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { return; }
    if (!file.type.startsWith('image/')) { return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({ ...prev, imageUrl: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Fetch recipes on mount
  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch('/api/recipes', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes || []);
      }
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Reset form
  const resetForm = () => {
    setFormData({ title: '', description: '', servings: '', prepTime: '', cookTime: '', instructions: '', sourceUrl: '', imageUrl: '', tags: [], isFavorite: false });
    setIngredients([{ ...EMPTY_INGREDIENT }]);
    setStepGroups([{ ...EMPTY_STEP_GROUP }]);
    setEditingRecipeId(null);
    setAiPrefilled(false);
  };

  // Open form for new recipe
  const handleNewRecipe = () => {
    resetForm();
    setViewMode('form');
  };

  // Open form for editing
  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setFormData({
      title: recipe.title,
      description: recipe.description || '',
      servings: recipe.servings?.toString() || '',
      prepTime: recipe.prepTime?.toString() || '',
      cookTime: recipe.cookTime?.toString() || '',
      instructions: recipe.instructions || '',
      sourceUrl: recipe.sourceUrl || '',
      imageUrl: recipe.imageUrl || '',
      tags: (recipe.tags || []) as string[],
      isFavorite: recipe.isFavorite || false,
    });
    // Populate flat ingredients list
    setIngredients(
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity?.toString() || '',
            unit: ing.unit || '',
            notes: ing.notes || '',
            category: categorizeItem(ing.name),
          }))
        : [{ ...EMPTY_INGREDIENT }]
    );
    // Build name-to-index map from flat ingredients
    const ingNames = recipe.ingredients.map((ing) => ing.name.toLowerCase());
    // Populate step groups from recipe.steps or fall back to flat format
    if (recipe.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0) {
      setStepGroups((recipe.steps as RecipeStep[]).map((sg) => ({
        title: sg.title || '',
        ingredientIndices: sg.ingredients
          .map((ing) => ingNames.indexOf(ing.name.toLowerCase()))
          .filter((idx) => idx !== -1),
        instructions: sg.instructions.length > 0 ? [...sg.instructions] : [''],
      })));
    } else {
      // Backwards compat: single step group with all ingredients selected
      const instrText = recipe.instructions || '';
      const parsed = instrText.split(/\n/).map((s) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
      setStepGroups([{
        title: 'Instructions',
        ingredientIndices: recipe.ingredients.map((_, i) => i),
        instructions: parsed.length > 0 ? parsed : [''],
      }]);
    }
    setViewMode('form');
  };

  // Save recipe (create or update)
  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      // Build steps Json from step groups, resolving ingredient indices to data
      const stepsJson = stepGroups.map((sg) => ({
        title: sg.title.trim() || 'Instructions',
        ingredients: sg.ingredientIndices
          .filter((idx) => ingredients[idx] && ingredients[idx].name.trim())
          .map((idx) => {
            const ing = ingredients[idx];
            return {
              name: ing.name.trim(),
              quantity: ing.quantity ? parseFloat(ing.quantity) : null,
              unit: ing.unit.trim() || null,
              notes: ing.notes.trim() || null,
            };
          }),
        instructions: sg.instructions.filter((s) => s.trim()).map((s) => s.trim()),
      })).filter((sg) => sg.ingredients.length > 0 || sg.instructions.length > 0);

      // Use the flat ingredients list for RecipeIngredient rows (for grocery list)
      const flatIngredients = ingredients.filter((ing) => ing.name.trim());

      // Build flat instructions string for backwards compat
      let stepCounter = 0;
      const instructionLines: string[] = [];
      for (const sg of stepsJson) {
        for (const instr of sg.instructions) {
          stepCounter++;
          instructionLines.push(`${stepCounter}. ${instr}`);
        }
      }
      const instructionsText = instructionLines.join('\n');

      const payload = {
        ...formData,
        instructions: instructionsText || null,
        steps: stepsJson.length > 0 ? stepsJson : null,
        servings: formData.servings || null,
        prepTime: formData.prepTime || null,
        cookTime: formData.cookTime || null,
        ingredients: flatIngredients.map((ing) => ({
          name: ing.name.trim(),
          quantity: ing.quantity ? parseFloat(ing.quantity) : null,
          unit: ing.unit.trim() || null,
          notes: ing.notes.trim() || null,
        })),
      };

      const url = editingRecipeId ? `/api/recipes/${editingRecipeId}` : '/api/recipes';
      const method = editingRecipeId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingRecipeId) {
          setRecipes((prev) => prev.map((r) => (r.id === editingRecipeId ? data.recipe : r)));
        } else {
          setRecipes((prev) => [data.recipe, ...prev]);
        }
        setSelectedRecipe(data.recipe);
        setViewMode('detail');
        resetForm();
      }
    } catch (err) {
      console.error('Failed to save recipe:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete recipe
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
        if (selectedRecipe?.id === id) {
          setSelectedRecipe(null);
          setViewMode('list');
        }
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (recipe: Recipe) => {
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isFavorite: !recipe.isFavorite }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? data.recipe : r)));
        if (selectedRecipe?.id === recipe.id) setSelectedRecipe(data.recipe);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Add ingredients to grocery list
  const handleAddToGrocery = async (recipe: Recipe) => {
    setAddingToGrocery(true);
    try {
      for (const ing of recipe.ingredients) {
        const itemName = ing.name;
        const category = categorizeItem(itemName);
        await addShoppingItem({
          listType: 'grocery',
          name: itemName,
          quantity: ing.quantity ? Math.ceil(ing.quantity) : 1,
          unit: ing.unit || null,
          category,
          notes: ing.notes || '',
          checked: false,
          priority: null,
          price: null,
          perishable: null,
        });
      }
      setGroceryAdded(true);
      setTimeout(() => setGroceryAdded(false), 3000);
    } catch (err) {
      console.error('Failed to add ingredients to grocery:', err);
    } finally {
      setAddingToGrocery(false);
    }
  };

  // AI extraction
  const handleAiExtract = async () => {
    if (!aiInput.trim()) return;
    setAiExtracting(true);
    setAiError('');
    try {
      const res = await fetch('/api/recipes/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: aiInput.trim(), customTags: customTags }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'Failed to extract recipe');
        return;
      }
      const r = data.recipe;
      setFormData({
        title: r.title || '',
        description: r.description || '',
        servings: r.servings?.toString() || '',
        prepTime: r.prepTime?.toString() || '',
        cookTime: r.cookTime?.toString() || '',
        instructions: '',
        sourceUrl: r.sourceUrl || '',
        imageUrl: r.imageUrl || '',
        tags: r.tags || [],
        isFavorite: false,
      });
      // Populate flat ingredients list from AI response
      setIngredients(
        (r.ingredients || []).length > 0
          ? r.ingredients.map((ing: { name: string; quantity?: number; unit?: string; notes?: string; category?: string }) => ({
              name: ing.name || '',
              quantity: ing.quantity?.toString() || '',
              unit: ing.unit || '',
              notes: ing.notes || '',
              category: ing.category || categorizeItem(ing.name || ''),
            }))
          : [{ ...EMPTY_INGREDIENT }]
      );
      // Build name-to-index map from the flat ingredients we just set
      const flatIngNames = (r.ingredients || []).map((ing: { name: string }) => (ing.name || '').toLowerCase());
      // Populate step groups from AI response, matching ingredient names to flat list indices
      if (r.steps && Array.isArray(r.steps) && r.steps.length > 0) {
        setStepGroups(r.steps.map((sg: { title?: string; ingredients?: { name: string }[]; instructions?: string[] }) => ({
          title: sg.title || '',
          ingredientIndices: (sg.ingredients || [])
            .map((ing: { name: string }) => flatIngNames.indexOf((ing.name || '').toLowerCase()))
            .filter((idx: number) => idx !== -1),
          instructions: (sg.instructions || []).length > 0
            ? (sg.instructions || []).map((s: string) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
            : [''],
        })));
      } else {
        // Fallback: single step with all ingredients selected
        const instrRaw = r.instructions;
        let parsedSteps: string[] = [];
        if (Array.isArray(instrRaw)) {
          parsedSteps = instrRaw.map((s: string) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
        } else if (typeof instrRaw === 'string') {
          parsedSteps = instrRaw.split(/\n/).map((s: string) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
        }
        setStepGroups([{
          title: 'Instructions',
          ingredientIndices: flatIngNames.map((_: string, i: number) => i),
          instructions: parsedSteps.length > 0 ? parsedSteps : [''],
        }]);
      }
      setShowAiModal(false);
      setAiInput('');
      setEditingRecipeId(null);
      setAiPrefilled(true);
      setViewMode('form');
    } catch {
      setAiError('Failed to extract recipe. Please try again.');
    } finally {
      setAiExtracting(false);
    }
  };

  // Flat ingredient helpers
  const addFlatIngredient = () => setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  const removeFlatIngredient = (index: number) => {
    setIngredients((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
    // Update step group indices: remove the index, shift down indices above it
    setStepGroups((prev) => prev.map((sg) => ({
      ...sg,
      ingredientIndices: sg.ingredientIndices
        .filter((idx) => idx !== index)
        .map((idx) => idx > index ? idx - 1 : idx),
    })));
  };
  const updateFlatIngredient = (index: number, field: keyof IngredientFormData, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => {
      if (i !== index) return ing;
      const updated = { ...ing, [field]: value };
      if (field === 'name' && value.trim()) updated.category = categorizeItem(value);
      return updated;
    }));
  };

  // Step group helpers
  const addStepGroup = () => setStepGroups((prev) => [...prev, { ...EMPTY_STEP_GROUP }]);
  const removeStepGroup = (gi: number) => {
    setStepGroups((prev) => prev.length > 1 ? prev.filter((_, i) => i !== gi) : prev);
  };
  const updateStepGroupTitle = (gi: number, title: string) => {
    setStepGroups((prev) => prev.map((sg, i) => i === gi ? { ...sg, title } : sg));
  };
  // Toggle an ingredient index in a step group
  const toggleStepIngredient = (gi: number, ingIndex: number) => {
    setStepGroups((prev) => prev.map((sg, i) => {
      if (i !== gi) return sg;
      const has = sg.ingredientIndices.includes(ingIndex);
      return {
        ...sg,
        ingredientIndices: has
          ? sg.ingredientIndices.filter((idx) => idx !== ingIndex)
          : [...sg.ingredientIndices, ingIndex],
      };
    }));
  };
  // Instruction helpers within a step group
  const addInstruction = (gi: number) => {
    setStepGroups((prev) => prev.map((sg, i) => i === gi ? { ...sg, instructions: [...sg.instructions, ''] } : sg));
  };
  const removeInstruction = (gi: number, si: number) => {
    setStepGroups((prev) => prev.map((sg, i) => {
      if (i !== gi) return sg;
      return { ...sg, instructions: sg.instructions.length > 1 ? sg.instructions.filter((_, j) => j !== si) : sg.instructions };
    }));
  };
  const updateInstruction = (gi: number, si: number, value: string) => {
    setStepGroups((prev) => prev.map((sg, i) => {
      if (i !== gi) return sg;
      return { ...sg, instructions: sg.instructions.map((s, j) => j === si ? value : s) };
    }));
  };

  // Tag helpers
  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  // Filtered recipes
  const filteredRecipes = recipes.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.ingredients.some((ing) => ing.name.toLowerCase().includes(q)) ||
      (r.tags as string[] | null)?.some((t) => t.toLowerCase().includes(q)) ||
      r.instructions?.toLowerCase().includes(q);
    const matchesTag = !tagFilter || (tagFilter === '__favorites__' ? r.isFavorite : (r.tags as string[] | null)?.includes(tagFilter));
    return matchesSearch && matchesTag;
  });

  // All tags used across recipes
  const allTags = Array.from(new Set(recipes.flatMap((r) => (r.tags as string[] | null) || [])));

  // Merged tag suggestions: built-in + custom tags from existing recipes + current form tags
  const builtInTags = RECIPE_TAG_SUGGESTIONS as readonly string[];
  const customTags = allTags.filter((t) => !builtInTags.includes(t));
  const formCustomTags = formData.tags.filter((t) => !builtInTags.includes(t) && !customTags.includes(t));
  const allTagSuggestions = [...builtInTags, ...customTags, ...formCustomTags];

  if (loading) {
    return (
      <Card style={{ height: 'auto', padding: isMobile ? '32px 16px' : '48px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading recipes...</div>
      </Card>
    );
  }

  // ===== DETAIL VIEW =====
  if (viewMode === 'detail' && selectedRecipe) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => { setViewMode('list'); setSelectedRecipe(null); }}
            className="text-[var(--text-muted)] hover:text-[var(--text)]"
            style={{ padding: '4px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text)', flex: 1, margin: 0 }}>
            {selectedRecipe.title}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => handleToggleFavorite(selectedRecipe)}>
              <Star size={16} fill={selectedRecipe.isFavorite ? 'currentColor' : 'none'} style={{ color: selectedRecipe.isFavorite ? '#f59e0b' : undefined }} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleEditRecipe(selectedRecipe)}>
              <Edit2 size={14} />
              {!isMobile && <span style={{ marginLeft: '6px' }}>Edit</span>}
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(selectedRecipe.id)}>
              <Trash2 size={14} />
              {!isMobile && <span style={{ marginLeft: '6px' }}>Delete</span>}
            </Button>
          </div>
        </div>

        {/* Recipe image */}
        {selectedRecipe.imageUrl && (
          <div style={{ borderRadius: 'var(--radius, 8px)', overflow: 'hidden', height: '360px' }}>
            <img src={selectedRecipe.imageUrl} alt={selectedRecipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
          </div>
        )}

        {/* Recipe metadata */}
        <Card style={{ height: 'auto' }}>
          {selectedRecipe.description && (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>{selectedRecipe.description}</p>
          )}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: (selectedRecipe.tags as string[] | null)?.length ? '12px' : '0' }}>
            {selectedRecipe.servings && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Users size={14} /> {selectedRecipe.servings} servings
              </div>
            )}
            {selectedRecipe.prepTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Clock size={14} /> Prep: {selectedRecipe.prepTime}m
              </div>
            )}
            {selectedRecipe.cookTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Clock size={14} /> Cook: {selectedRecipe.cookTime}m
              </div>
            )}
            {selectedRecipe.sourceUrl && (
              <a
                href={selectedRecipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '13px', textDecoration: 'none' }}
              >
                <ExternalLink size={14} /> Source
              </a>
            )}
          </div>
          {(selectedRecipe.tags as string[] | null)?.length ? (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(selectedRecipe.tags as string[]).map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--accent)',
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2))',
                    color: 'var(--accent-text)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </Card>

        {/* All Ingredients + Add to Grocery */}
        <Card style={{ height: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Ingredients ({selectedRecipe.ingredients.length})
            </h3>
            {selectedRecipe.ingredients.length > 0 && (
              <Button
                variant={groceryAdded ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => handleAddToGrocery(selectedRecipe)}
                disabled={addingToGrocery || groceryAdded}
              >
                <ShoppingCart size={14} />
                <span style={{ marginLeft: '6px' }}>
                  {groceryAdded ? 'Added!' : addingToGrocery ? 'Adding...' : 'Add to Grocery List'}
                </span>
              </Button>
            )}
          </div>
          {selectedRecipe.ingredients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {selectedRecipe.ingredients.map((ing, index) => (
                <div
                  key={ing.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: index < selectedRecipe.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px', minWidth: '60px' }}>
                    {ing.quantity ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}` : ''}
                  </span>
                  <span style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}>{ing.name}</span>
                  {ing.notes && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>{ing.notes}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No ingredients listed</p>
          )}
        </Card>

        {/* Grouped Steps View */}
        {selectedRecipe.steps && Array.isArray(selectedRecipe.steps) && (selectedRecipe.steps as RecipeStep[]).length > 0 ? (
          (selectedRecipe.steps as RecipeStep[]).map((sg, gi) => (
            <Card key={gi} style={{ height: 'auto' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: '14px' }}>
                <span style={{ color: 'var(--accent)' }}>Step {gi + 1}</span>
                {sg.title ? ` — ${sg.title}` : ''}
              </h3>

              {/* Step ingredients */}
              {sg.ingredients.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Ingredients</label>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {sg.ingredients.map((ing, ii) => (
                      <div
                        key={ii}
                        style={{
                          padding: '6px 0',
                          borderBottom: ii < sg.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'baseline',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px', minWidth: '60px' }}>
                          {ing.quantity ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}` : ''}
                        </span>
                        <span style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}>{ing.name}</span>
                        {ing.notes && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>{ing.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step instructions */}
              {sg.instructions.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Instructions</label>
                  <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sg.instructions.map((instr, si) => (
                      <li key={si} style={{ color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' }}>
                        {instr}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </Card>
          ))
        ) : (
          <>
            {/* Fallback: flat ingredients + instructions for old recipes */}
            <Card style={{ height: 'auto' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: '12px' }}>
                Ingredients ({selectedRecipe.ingredients.length})
              </h3>
              {selectedRecipe.ingredients.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {selectedRecipe.ingredients.map((ing, index) => (
                    <div
                      key={ing.id}
                      style={{
                        padding: '8px 0',
                        borderBottom: index < selectedRecipe.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px', minWidth: '60px' }}>
                        {ing.quantity ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}` : ''}
                      </span>
                      <span style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}>{ing.name}</span>
                      {ing.notes && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>{ing.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No ingredients listed</p>
              )}
            </Card>

            {selectedRecipe.instructions && (
              <Card style={{ height: 'auto' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: '12px' }}>Instructions</h3>
                <div style={{ color: 'var(--text)', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {selectedRecipe.instructions}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  // ===== FORM VIEW (Create / Edit) =====
  if (viewMode === 'form') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => { setViewMode(selectedRecipe ? 'detail' : 'list'); resetForm(); }}
            className="text-[var(--text-muted)] hover:text-[var(--text)]"
            style={{ padding: '4px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text)', margin: 0, flex: 1 }}>
            {editingRecipeId ? 'Edit Recipe' : 'New Recipe'}
          </h2>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, isFavorite: !prev.isFavorite }))}
            className="text-[var(--text-muted)] hover:text-[#f59e0b]"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            title={formData.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={20} fill={formData.isFavorite ? '#f59e0b' : 'none'} style={{ color: formData.isFavorite ? '#f59e0b' : undefined }} />
          </button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !formData.title.trim()}>
            {saving ? 'Saving...' : editingRecipeId ? 'Save Changes' : 'Save Recipe'}
          </Button>
        </div>

        {aiPrefilled && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text)',
          }}>
            <Sparkles size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />
            AI extracted this recipe. Review the details below, then save.
          </div>
        )}

        <Card style={{ height: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '16px' }}>
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Recipe name"
              required
              autoFocus
            />
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description (optional)"
            />
            <div className="grid grid-cols-3" style={{ gap: isMobile ? '8px' : '16px' }}>
              <Input
                label="Servings"
                type="number"
                min={1}
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                placeholder="4"
              />
              <Input
                label="Prep (min)"
                type="number"
                min={0}
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                placeholder="15"
              />
              <Input
                label="Cook (min)"
                type="number"
                min={0}
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                placeholder="30"
              />
            </div>
            <Input
              label="Source URL"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              placeholder="https://..."
            />
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>Recipe Image</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {formData.imageUrl ? (
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-xs, 6px)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                    <img src={formData.imageUrl} alt="Recipe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-xs, 6px)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--panel-2)', flexShrink: 0 }}>
                    <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={() => imageInputRef.current?.click()}>
                    <Camera size={14} />
                    <span style={{ marginLeft: '4px' }}>{formData.imageUrl ? 'Change' : 'Upload'}</span>
                  </Button>
                  {formData.imageUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}>
                      <X size={14} />
                      <span style={{ marginLeft: '4px' }}>Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>Tags</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {allTagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: '1px solid',
                      borderColor: formData.tags.includes(tag) ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: formData.tags.includes(tag) ? 'var(--accent)' : 'transparent',
                      color: formData.tags.includes(tag) ? 'var(--accent-text)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {(() => {
                const scale = isMobile ? 0.75 : 1;
                const rawWidth = isMobile ? 130 : 100;
                const rawBtnWidth = 28;
                const rawGap = 4;
                const totalRaw = rawWidth + rawGap + rawBtnWidth;
                return (
                  <div style={{
                    display: 'inline-flex',
                    gap: `${rawGap}px`,
                    alignItems: 'center',
                    transform: isMobile ? `scale(${scale})` : undefined,
                    transformOrigin: 'left center',
                    width: isMobile ? `${totalRaw}px` : undefined,
                    marginRight: isMobile ? `${-totalRaw * (1 - scale)}px` : undefined,
                  }}>
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const tag = customTagInput.trim();
                          if (tag && !formData.tags.includes(tag)) {
                            setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
                          }
                          setCustomTagInput('');
                        }
                      }}
                      placeholder="Add tag"
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text)',
                        fontSize: isMobile ? '16px' : '12px',
                        outline: 'none',
                        width: `${rawWidth}px`,
                        height: '28px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const tag = customTagInput.trim();
                        if (tag && !formData.tags.includes(tag)) {
                          setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
                        }
                        setCustomTagInput('');
                      }}
                      style={{
                        fontSize: isMobile ? '16px' : '12px',
                        padding: '3px',
                        borderRadius: '999px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        height: `${rawBtnWidth}px`,
                        width: `${rawBtnWidth}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </Card>

        {/* All Ingredients (editable flat list) */}
        <Card style={{ height: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: '12px' }}>Ingredients</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ingredients.map((ing, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 2 }}>
                  <Input
                    value={ing.name}
                    onChange={(e) => updateFlatIngredient(index, 'name', e.target.value)}
                    placeholder="Ingredient name"
                  />
                </div>
                <div style={{ flex: 0, minWidth: isMobile ? '50px' : '70px' }}>
                  <Input
                    value={ing.quantity}
                    onChange={(e) => updateFlatIngredient(index, 'quantity', e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div style={{ flex: 0, minWidth: isMobile ? '50px' : '70px' }}>
                  <Input
                    value={ing.unit}
                    onChange={(e) => updateFlatIngredient(index, 'unit', e.target.value)}
                    placeholder="cup"
                  />
                </div>
                {!isMobile && (
                  <div style={{ flex: 0, minWidth: '120px' }}>
                    <Select
                      value={ing.category}
                      onChange={(e) => updateFlatIngredient(index, 'category', e.target.value)}
                      options={[
                        { value: '', label: 'Auto' },
                        ...INGREDIENT_CATEGORIES.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </div>
                )}
                {!isMobile && (
                  <div style={{ flex: 1 }}>
                    <Input
                      value={ing.notes}
                      onChange={(e) => updateFlatIngredient(index, 'notes', e.target.value)}
                      placeholder="diced, minced..."
                    />
                  </div>
                )}
                <button
                  onClick={() => removeFlatIngredient(index)}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px' }}>
            <Button variant="secondary" size="sm" onClick={addFlatIngredient}>
              <Plus size={14} />
              <span style={{ marginLeft: '4px' }}>Add Ingredient</span>
            </Button>
          </div>
        </Card>

        {/* Step Groups */}
        {stepGroups.map((sg, gi) => {
          const validIngredients = ingredients.map((ing, i) => ({ ing, i })).filter(({ ing }) => ing.name.trim());
          return (
            <Card key={gi} style={{ height: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>Step {gi + 1}</span>
                <div style={{ flex: 1 }}>
                  <Input
                    value={sg.title}
                    onChange={(e) => updateStepGroupTitle(gi, e.target.value)}
                    placeholder={gi === 0 ? 'e.g. Prep' : 'e.g. Cook, Assembly...'}
                  />
                </div>
                {stepGroups.length > 1 && (
                  <button
                    onClick={() => removeStepGroup(gi)}
                    className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    title="Remove step group"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Select ingredients for this step */}
              {validIngredients.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Ingredients used in this step</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {validIngredients.map(({ ing, i: ingIdx }) => {
                      const selected = sg.ingredientIndices.includes(ingIdx);
                      return (
                        <button
                          key={ingIdx}
                          type="button"
                          onClick={() => toggleStepIngredient(gi, ingIdx)}
                          style={{
                            fontSize: '12px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: selected ? 'var(--accent)' : 'var(--border)',
                            backgroundColor: selected ? 'var(--accent)' : 'transparent',
                            color: selected ? 'var(--accent-text)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {ing.quantity ? `${ing.quantity} ` : ''}{ing.unit ? `${ing.unit} ` : ''}{ing.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Instructions for this step group */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Instructions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sg.instructions.map((instr, si) => (
                    <div key={si} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>
                        {si + 1}.
                      </span>
                      <div style={{ flex: 1 }}>
                        <Input
                          value={instr}
                          onChange={(e) => updateInstruction(gi, si, e.target.value)}
                          placeholder={si === 0 ? 'First instruction...' : 'Next step...'}
                        />
                      </div>
                      <button
                        onClick={() => removeInstruction(gi, si)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={() => addInstruction(gi)}>
                    <Plus size={14} />
                    <span style={{ marginLeft: '4px' }}>Add Instruction</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        <div>
          <Button variant="secondary" size="sm" onClick={addStepGroup}>
            <Plus size={14} />
            <span style={{ marginLeft: '4px' }}>Add Step Group</span>
          </Button>
        </div>

        {/* Save / Cancel buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
          <Button variant="primary" onClick={handleSave} disabled={saving || !formData.title.trim()}>
            {saving ? 'Saving...' : editingRecipeId ? 'Save Changes' : 'Create Recipe'}
          </Button>
          <Button variant="secondary" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} onClick={() => { setViewMode(selectedRecipe ? 'detail' : 'list'); resetForm(); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: isMobile ? '120px' : '200px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setShowAiModal(true); setAiInput(''); setAiError(''); }}>
          <Sparkles size={14} />
          <span style={{ marginLeft: '6px' }}>{isMobile ? 'AI' : 'AI Extract'}</span>
        </Button>
        <Button variant="primary" size="sm" onClick={handleNewRecipe}>
          <Plus size={14} />
          <span style={{ marginLeft: '6px' }}>{isMobile ? 'New' : 'New Recipe'}</span>
        </Button>
      </div>

      {/* Tag Filters */}
      {recipes.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTagFilter('')}
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: !tagFilter ? 'var(--accent)' : 'var(--border)',
              backgroundColor: !tagFilter ? 'var(--accent)' : 'transparent',
              color: !tagFilter ? 'var(--accent-text)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            All
          </button>
          <button
            onClick={() => setTagFilter(tagFilter === '__favorites__' ? '' : '__favorites__')}
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: tagFilter === '__favorites__' ? '#f59e0b' : 'var(--border)',
              backgroundColor: tagFilter === '__favorites__' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: tagFilter === '__favorites__' ? '#f59e0b' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Star size={11} fill={tagFilter === '__favorites__' ? '#f59e0b' : 'none'} /> Favorites
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: tagFilter === tag ? 'var(--accent)' : 'var(--border)',
                backgroundColor: tagFilter === tag ? 'var(--accent)' : 'transparent',
                color: tagFilter === tag ? 'var(--accent-text)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Recipe Cards Grid */}
      {filteredRecipes.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: isMobile ? '10px' : '16px',
          }}
        >
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, recipe.id)}
            >
            <Card
              style={{
                height: 'auto',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onClick={() => { setSelectedRecipe(recipe); setViewMode('detail'); }}
            >
              {recipe.imageUrl && (
                <div style={{ margin: '-16px -16px 10px -16px', borderRadius: 'var(--radius, 8px) var(--radius, 8px) 0 0', overflow: 'hidden', height: '140px' }}>
                  <img src={recipe.imageUrl} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  margin: 0,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {recipe.title}
                </h3>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleFavorite(recipe); }}
                  className="text-[var(--text-muted)] hover:text-[#f59e0b]"
                  style={{ padding: '2px', flexShrink: 0, marginLeft: '8px' }}
                >
                  <Star size={14} fill={recipe.isFavorite ? '#f59e0b' : 'none'} style={{ color: recipe.isFavorite ? '#f59e0b' : undefined }} />
                </button>
              </div>

              {recipe.description && (
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  margin: '0 0 8px 0',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.4',
                }}>
                  {recipe.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', marginBottom: (recipe.tags as string[] | null)?.length ? '8px' : '0' }}>
                {recipe.cookTime && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {(recipe.prepTime || 0) + recipe.cookTime}m
                  </span>
                )}
                {recipe.ingredients.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                  </span>
                )}
                {recipe.servings && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} /> {recipe.servings}
                  </span>
                )}
              </div>

              {(recipe.tags as string[] | null)?.length ? (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {(recipe.tags as string[]).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--panel-2)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {(recipe.tags as string[]).length > 3 && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{(recipe.tags as string[]).length - 3}</span>
                  )}
                </div>
              ) : null}
            </Card>
            </div>
          ))}
        </div>
      ) : recipes.length > 0 ? (
        <Card style={{ height: 'auto', padding: isMobile ? '24px 16px' : '32px', textAlign: 'center' }}>
          <Search size={24} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '8px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No recipes match your search</p>
        </Card>
      ) : (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="No recipes yet"
          description="Save your favorite recipes here. Add them manually or use AI to extract from any URL or text."
          action={{ label: 'Add Recipe', onClick: handleNewRecipe }}
        />
      )}

      {/* AI Extraction Modal — rendered via portal to dim sidebar */}
      {mounted && showAiModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowAiModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: '12px',
              padding: isMobile ? '20px' : '24px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 600, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} /> AI Recipe Extract
              </h2>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
                style={{ padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Paste a recipe URL or raw recipe text and AI will extract the title, ingredients, instructions, and more.
            </p>

            <Textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Paste a recipe URL or recipe text here..."
              autoExpand
              maxHeight={200}
              style={{ minHeight: '100px', marginBottom: '12px' }}
              autoFocus
            />

            {aiError && (
              <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>{aiError}</p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowAiModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAiExtract} disabled={!aiInput.trim() || aiExtracting}>
                {aiExtracting ? 'Extracting...' : 'Extract Recipe'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Context Menu */}
      {mounted && contextMenu && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: 'var(--panel-solid, var(--panel))',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 9999,
              minWidth: '180px',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => {
                const recipe = recipes.find((r) => r.id === contextMenu.recipeId);
                if (recipe) handleEditRecipe(recipe);
                setContextMenu(null);
              }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px',
                border: 'none', background: 'transparent', color: 'var(--text)',
                cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              onClick={() => {
                handleDelete(contextMenu.recipeId);
                setContextMenu(null);
              }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px',
                border: 'none', background: 'transparent', color: '#dc2626',
                cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

"use client";

import { useTransition, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/lib/schemas";
import { createProduct, updateProduct } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  ImageIcon, 
  Share2, 
  Heart, 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Tag, 
  Layers,
  Scale,
  Fish,
  Users,
  Clock,
  Leaf,
  Flame,
  Sparkles,
  ShieldCheck,
  ChefHat,
  Scissors,
  CheckCircle2,
  Circle,
  HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ImageUpload } from "@/components/shared/image-upload";
import { MobilePreview } from "@/components/shared/mobile-preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFormProps {
  initialData?: any;
}

const AVAILABLE_ICONS = [
  { value: "scale", label: "Scale / Weight", icon: Scale },
  { value: "fish", label: "Fish / Gross Wt", icon: Fish },
  { value: "users", label: "People / Serves", icon: Users },
  { value: "clock", label: "Clock / Cook Time", icon: Clock },
  { value: "leaf", label: "Leaf / Freshness", icon: Leaf },
  { value: "flame", label: "Flame / Spice Level", icon: Flame },
  { value: "sparkles", label: "Sparkles / Premium", icon: Sparkles },
  { value: "shield_check", label: "Shield / Safety", icon: ShieldCheck },
  { value: "heart", label: "Heart / Healthy", icon: Heart },
];

function getIconComponent(iconName?: string) {
  switch (iconName) {
    case "fish": return Fish;
    case "users": return Users;
    case "clock": return Clock;
    case "leaf": return Leaf;
    case "flame": return Flame;
    case "sparkles": return Sparkles;
    case "shield_check": return ShieldCheck;
    case "heart": return Heart;
    case "scale":
    default:
      return Scale;
  }
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    async function loadCategories() {
      const data = await getCategories();
      if (data) setCategories(data);
    }
    loadCategories();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? { 
      name: initialData.name || "",
      slug: initialData.slug || "",
      category_id: initialData.category_id || "",
      subcategory_id: initialData.subcategory_id || "",
      mrp: Number(initialData.mrp) || 0,
      selling_price: Number(initialData.selling_price) || 0,
      purchase_price: Number(initialData.purchase_price) || 0,
      discount_percentage: Number(initialData.discount_percentage) || 0,
      gst_percentage: Number(initialData.gst_percentage) || 0,
      stock: Number(initialData.stock) || 0,
      minimum_stock: Number(initialData.minimum_stock) || 5,
      weight: Number(initialData.weight) || 1,
      unit: initialData.unit || "kg",
      search_tags: Array.isArray(initialData.search_tags) ? initialData.search_tags.join(", ") : (initialData.search_tags || ""),
      description: initialData.description || "",
      short_description: initialData.short_description || "",
      brand: initialData.brand || "",
      sku: initialData.sku || "",
      barcode: initialData.barcode || "",
      expiry_date: initialData.expiry_date || "",
      shelf_life: initialData.shelf_life || "",
      ingredients: initialData.ingredients || "",
      nutrition_info: initialData.nutrition_info || "",
      country_of_origin: initialData.country_of_origin || "India",
      is_available: initialData.is_available ?? true,
      is_unique: initialData.is_unique || (Array.isArray(initialData.labels) && initialData.labels.includes("Unique")),
      labels: initialData.labels || [],
      images: initialData.images || (initialData.product_images ? initialData.product_images.map((img: any) => img.image_url) : []),
      variants: (initialData.variants || []).map((v: any) => ({
        weight: Number(v.weight) || 0,
        unit: v.unit || "gms",
        mrp: Number(v.mrp) || 0,
        selling_price: Number(v.selling_price) || 0,
        stock: Number(v.stock) || 0,
      })),
      info_fields: (initialData.info_fields && Array.isArray(initialData.info_fields) && initialData.info_fields.length > 0)
        ? [
            initialData.info_fields[0] || { icon: "scale", label: "", value: "" },
            initialData.info_fields[1] || { icon: "fish", label: "", value: "" },
            initialData.info_fields[2] || { icon: "users", label: "", value: "" },
            initialData.info_fields[3] || { icon: "clock", label: "", value: "" },
          ]
        : [
            { icon: "scale", label: "", value: "" },
            { icon: "fish", label: "", value: "" },
            { icon: "users", label: "", value: "" },
            { icon: "clock", label: "", value: "" },
          ],
      prep_options: (initialData.prep_options || []).map((p: any, idx: number) => ({
        id: p.id || `prep_${idx + 1}`,
        name: p.name || "",
        description: p.description || "",
        price_adjustment: Number(p.price_adjustment) || 0,
        is_default: p.is_default ?? (idx === 0),
      })),
      extra_options: (initialData.extra_options || []).map((e: any, idx: number) => ({
        id: e.id || `extra_${idx + 1}`,
        name: e.name || "",
        price_adjustment: Number(e.price_adjustment) || 0,
        is_default: e.is_default ?? false,
      })),
      recipes: (initialData.recipes || []).map((r: any, idx: number) => ({
        id: r.id || `recipe_${idx + 1}`,
        title: r.title || "",
        description: r.description || "",
        prep_time: r.prep_time || "",
        image_url: r.image_url || "",
      })),
    } : {
      name: "",
      slug: "",
      description: "",
      short_description: "",
      mrp: 0,
      selling_price: 0,
      purchase_price: 0,
      discount_percentage: 0,
      gst_percentage: 0,
      category_id: "",
      subcategory_id: "",
      brand: "",
      sku: "",
      barcode: "",
      stock: 50,
      minimum_stock: 5,
      weight: 1,
      unit: "kg",
      expiry_date: "",
      shelf_life: "",
      ingredients: "",
      nutrition_info: "",
      country_of_origin: "India",
      search_tags: "",
      labels: [],
      images: [],
      is_available: true,
      is_unique: false,
      variants: [],
      info_fields: [
        { icon: "scale", label: "", value: "" },
        { icon: "fish", label: "", value: "" },
        { icon: "users", label: "", value: "" },
        { icon: "clock", label: "", value: "" },
      ],
      prep_options: [],
      extra_options: [],
      recipes: [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const { fields: prepFields, append: appendPrep, remove: removePrep } = useFieldArray({
    control: form.control,
    name: "prep_options",
  });

  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({
    control: form.control,
    name: "extra_options",
  });

  const { fields: recipeFields, append: appendRecipe, remove: removeRecipe } = useFieldArray({
    control: form.control,
    name: "recipes",
  });

  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | "base">("base");
  const [previewSelectedPrepIdx, setPreviewSelectedPrepIdx] = useState<number>(0);
  const [previewSelectedExtras, setPreviewSelectedExtras] = useState<Record<number, boolean>>({});

  const mrp = form.watch("mrp");
  const sellingPrice = form.watch("selling_price");

  // Auto calculate discount percentage when MRP or Selling Price changes
  useEffect(() => {
    const numMrp = Number(mrp) || 0;
    const numSp = Number(sellingPrice) || 0;
    if (numMrp > numSp && numSp > 0) {
      const discount = Math.round(((numMrp - numSp) / numMrp) * 100);
      form.setValue("discount_percentage", discount, { shouldValidate: false });
    } else {
      form.setValue("discount_percentage", 0, { shouldValidate: false });
    }
  }, [mrp, sellingPrice, form]);

  const currentValues = form.watch();

  const handleNameChange = (nameVal: string) => {
    form.setValue("name", nameVal, { shouldValidate: true });
    const currentSlug = form.getValues("slug");
    if (!initialData && (!currentSlug || currentSlug.length === 0)) {
      const autoSlug = nameVal
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      form.setValue("slug", autoSlug, { shouldValidate: false });
    }
  };

  // Reset selectedVariantIdx if variant was removed
  useEffect(() => {
    if (
      typeof selectedVariantIdx === "number" &&
      (!currentValues.variants || selectedVariantIdx >= currentValues.variants.length)
    ) {
      setSelectedVariantIdx("base");
    }
  }, [currentValues.variants, selectedVariantIdx]);

  const onSubmit = (values: ProductFormValues) => {
    startTransition(async () => {
      // Clean up optional fields so empty rows are stripped
      const cleanedInfoFields = (values.info_fields || []).filter(
        (f) => f && (f.label?.trim() || f.value?.trim())
      );
      const cleanedPrepOptions = (values.prep_options || []).map((p, idx) => ({
        ...p,
        id: p.id || `prep_${Date.now()}_${idx}`,
        price_adjustment: Number(p.price_adjustment) || 0,
      })).filter((p) => p.name && p.name.trim().length > 0);

      const cleanedExtraOptions = (values.extra_options || []).map((e, idx) => ({
        ...e,
        id: e.id || `extra_${Date.now()}_${idx}`,
        price_adjustment: Number(e.price_adjustment) || 0,
      })).filter((e) => e.name && e.name.trim().length > 0);

      const cleanedRecipes = (values.recipes || []).map((r, idx) => ({
        ...r,
        id: r.id || `recipe_${Date.now()}_${idx}`,
      })).filter((r) => r.title && r.title.trim().length > 0);

      const payload: ProductFormValues = {
        ...values,
        info_fields: cleanedInfoFields,
        prep_options: cleanedPrepOptions,
        extra_options: cleanedExtraOptions,
        recipes: cleanedRecipes,
      };

      let result;
      if (initialData?.id) {
        result = await updateProduct(initialData.id, payload);
      } else {
        result = await createProduct(payload);
      }

      if (result.success) {
        toast.success(initialData?.id ? "Product updated successfully!" : "Product created successfully!");
        router.push("/products");
      } else {
        toast.error("Error saving product: " + result.error);
      }
    });
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    
    // Automatically switch active tab to where the first error is located
    if (errors.name || errors.category_id || errors.slug || errors.description || errors.short_description || errors.shelf_life || errors.ingredients || errors.nutrition_info) {
      setActiveTab("general");
    } else if (errors.info_fields || errors.prep_options || errors.extra_options || errors.recipes) {
      setActiveTab("customization");
    } else if (errors.mrp || errors.selling_price || errors.stock || errors.sku || errors.barcode || errors.variants) {
      setActiveTab("pricing");
    } else if (errors.images) {
      setActiveTab("media");
    } else {
      setActiveTab("settings");
    }

    const errorKeys = Object.keys(errors);
    const firstError = errorKeys.length > 0 ? errors[errorKeys[0]]?.message : null;

    if (firstError) {
      toast.error(`Required: ${firstError}`);
    } else {
      toast.error("Please fill in all required fields.");
    }
  };

  // Compute active preview details
  const previewDisplay = (() => {
    let baseSp = Number(currentValues.selling_price) || 0;
    let baseMrp = Number(currentValues.mrp) || 0;
    let unitStr = `${currentValues.weight || "1"} ${currentValues.unit || "kg"}`.trim();

    if (
      selectedVariantIdx !== "base" &&
      currentValues.variants &&
      currentValues.variants[selectedVariantIdx]
    ) {
      const v = currentValues.variants[selectedVariantIdx];
      baseSp = Number(v.selling_price) > 0 ? Number(v.selling_price) : baseSp;
      baseMrp = Number(v.mrp) > 0 ? Number(v.mrp) : baseMrp;
      unitStr = `${v.weight ?? ""} ${v.unit ?? ""}`.trim() || unitStr;
    }

    // Add selected prep option price adjustment if any
    if (currentValues.prep_options && currentValues.prep_options[previewSelectedPrepIdx]) {
      const prepAdj = Number(currentValues.prep_options[previewSelectedPrepIdx].price_adjustment) || 0;
      baseSp += prepAdj;
      baseMrp += prepAdj;
    }

    // Add extra options adjustments
    if (currentValues.extra_options) {
      currentValues.extra_options.forEach((opt, idx) => {
        if (previewSelectedExtras[idx]) {
          const adj = Number(opt.price_adjustment) || 0;
          baseSp += adj;
          baseMrp += adj;
        }
      });
    }

    const discount = baseMrp > baseSp && baseMrp > 0 ? Math.round(((baseMrp - baseSp) / baseMrp) * 100) : 0;
    return { sp: baseSp, mrp: baseMrp, unitStr, discount };
  })();

  const activeInfoFields = (currentValues.info_fields || []).filter(
    (f) => f && (f.label?.trim() || f.value?.trim())
  );

  return (
    <div className="flex gap-6 h-full max-w-7xl mx-auto pb-10">
      <div className="flex-1 min-w-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-heading font-bold">
                    {initialData ? "Edit Product" : "Add New Product"}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {initialData ? "Modify product details, cuts, and options" : "Create a new catalog item for mobile app"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>Discard</Button>
                <Button type="submit" disabled={isPending} className="shadow-md">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Product
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 max-w-3xl bg-card border shadow-sm">
                <TabsTrigger value="general">General Info</TabsTrigger>
                <TabsTrigger value="customization" className="relative">
                  Cuts & Info
                  {((currentValues.prep_options?.length || 0) > 0 || (currentValues.extra_options?.length || 0) > 0 || activeInfoFields.length > 0) && (
                    <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                <TabsTrigger value="media">Media Gallery</TabsTrigger>
                <TabsTrigger value="settings">Settings & SEO</TabsTrigger>
              </TabsList>

              {/* TAB 1: GENERAL INFO */}
              <TabsContent value="general" className="space-y-6 mt-6">
                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Basic Details</CardTitle>
                    <CardDescription>Enter the primary details for this product.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Product Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Fresh Vanjaram / Seer Fish" 
                              {...field} 
                              value={field.value ?? ""} 
                              onChange={(e) => handleNameChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Category *</FormLabel>
                          <Select onValueChange={(val) => field.onChange(val || "")} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="short_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="A brief summary for the product card..." {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Description (Telugu / English Breakdown)</FormLabel>
                          <FormControl>
                            <Textarea 
                              className="min-h-[140px] font-sans" 
                              placeholder="Freshly caught from Kakinada coast. Cleaned and packaged with highest hygiene standards..." 
                              {...field} 
                              value={field.value ?? ""} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="shelf_life"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shelf Life</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 2-3 days refrigerated" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country_of_origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country / Coast of Origin</FormLabel>
                            <FormControl>
                              <Input placeholder="Kakinada Coast, India" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="ingredients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage & Handling Instructions</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Store between 0-4°C. Wash before cooking..." {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nutrition_info"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nutrition Information</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Energy: 130 kcal, Protein: 22g, Healthy Omega-3 fatty acids..." {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: CUTS, EXTRAS, INFO STRIP & RECIPES */}
              <TabsContent value="customization" className="space-y-6 mt-6">
                {/* 1. INFO STRIP (4 SLOTS) */}
                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-emerald-500" />
                          Product Info Strip (4 Highlight Badges)
                        </CardTitle>
                        <CardDescription>
                          Optional highlight strip shown directly under product title in mobile app (e.g. Net Wt, Gross Wt, Serves, Cooking Time). Blank slots are hidden automatically.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const defaultIcons = ["scale", "fish", "users", "clock"];
                        const defaultLabels = ["Net Weight", "Gross Wt", "Serves", "Cooking Time"];
                        const defaultPlaceholders = ["500 gms", "700 gms", "2-3 People", "15-20 mins"];

                        return (
                          <div key={slotIdx} className="p-4 rounded-xl border bg-background/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[11px] font-bold">
                                  {slotIdx + 1}
                                </span>
                                Slot {slotIdx + 1}
                              </span>
                              {form.watch(`info_fields.${slotIdx}.value`) && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <FormLabel className="text-[11px]">Icon</FormLabel>
                                <Select
                                  value={form.watch(`info_fields.${slotIdx}.icon`) || defaultIcons[slotIdx]}
                                  onValueChange={(val) => form.setValue(`info_fields.${slotIdx}.icon`, val || "scale")}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {AVAILABLE_ICONS.map((ic) => {
                                      const IconComp = ic.icon;
                                      return (
                                        <SelectItem key={ic.value} value={ic.value}>
                                          <div className="flex items-center gap-2">
                                            <IconComp className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-xs">{ic.label}</span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <FormLabel className="text-[11px]">Label</FormLabel>
                                <Input
                                  className="h-9 text-xs"
                                  placeholder={defaultLabels[slotIdx]}
                                  {...form.register(`info_fields.${slotIdx}.label`)}
                                />
                              </div>

                              <div>
                                <FormLabel className="text-[11px]">Value</FormLabel>
                                <Input
                                  className="h-9 text-xs font-semibold"
                                  placeholder={defaultPlaceholders[slotIdx]}
                                  {...form.register(`info_fields.${slotIdx}.value`)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. PREPARATION / CUT OPTIONS ("How do you want it?") */}
                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-emerald-500" />
                        Preparation / Cut Options (&quot;How do you want it?&quot;)
                      </CardTitle>
                      <CardDescription>
                        Give customers cut choices (e.g. Curry Cut, Fry Cut, Biryani Cut, Whole Cleaned). Customer can select exactly one cut.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newId = `prep_${Date.now()}`;
                        appendPrep({
                          id: newId,
                          name: prepFields.length === 0 ? "Curry Cut" : "Fry Cut",
                          description: "Cleaned and cut into medium pieces",
                          price_adjustment: 0,
                          is_default: prepFields.length === 0,
                        });
                      }}
                      className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Cut Option
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {prepFields.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded-xl bg-muted/10">
                        <Scissors className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No preparation cuts configured.</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          If empty, the &quot;How do you want it?&quot; section is hidden in the customer app.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {prepFields.map((field, index) => {
                          const isDefault = form.watch(`prep_options.${index}.is_default`);
                          return (
                            <div
                              key={field.id}
                              className={`p-4 rounded-xl border transition-all relative group ${
                                isDefault 
                                  ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-sm" 
                                  : "border-border bg-background/50"
                              }`}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
                                onClick={() => removePrep(index)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <div className="md:col-span-4">
                                  <FormLabel className="text-xs font-semibold">Cut / Prep Name</FormLabel>
                                  <Input
                                    placeholder="e.g. Curry Cut, Biryani Cut, Fry Cut"
                                    className="h-9 mt-1 text-sm font-medium"
                                    {...form.register(`prep_options.${index}.name`)}
                                  />
                                </div>

                                <div className="md:col-span-4">
                                  <FormLabel className="text-xs font-semibold">Description</FormLabel>
                                  <Input
                                    placeholder="e.g. Small pieces with bone for curry"
                                    className="h-9 mt-1 text-xs"
                                    {...form.register(`prep_options.${index}.description`)}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <FormLabel className="text-xs font-semibold">Price Add (₹)</FormLabel>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    className="h-9 mt-1 text-xs font-bold"
                                    {...form.register(`prep_options.${index}.price_adjustment`, {
                                      valueAsNumber: true,
                                    })}
                                  />
                                </div>

                                <div className="md:col-span-2 flex flex-col justify-end pt-3 md:pt-0">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={isDefault ? "default" : "outline"}
                                    onClick={() => {
                                      prepFields.forEach((_, i) => {
                                        form.setValue(`prep_options.${i}.is_default`, i === index);
                                      });
                                    }}
                                    className={`h-9 text-xs font-medium w-full ${
                                      isDefault ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                                    }`}
                                  >
                                    {isDefault ? (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Default Cut
                                      </span>
                                    ) : (
                                      "Set Default"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3. EXTRA OPTIONS (Checkboxes) */}
                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-emerald-500" />
                        Extra Options & Preferences (Checkboxes)
                      </CardTitle>
                      <CardDescription>
                        Customization checkboxes (e.g. Remove Skin, Remove Head, Turmeric Clean). Customer can select multiple.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        appendExtra({
                          id: `extra_${Date.now()}`,
                          name: extraFields.length === 0 ? "Remove Head" : "Clean with Turmeric",
                          price_adjustment: 0,
                          is_default: false,
                        });
                      }}
                      className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Extra Option
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {extraFields.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded-xl bg-muted/10">
                        <Tag className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No extra preferences configured.</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          If empty, the &quot;Extra Options&quot; section is hidden in the customer app.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {extraFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 rounded-xl border border-border bg-background/50 relative group"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 right-3 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
                              onClick={() => removeExtra(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                              <div className="md:col-span-6">
                                <FormLabel className="text-xs font-semibold">Option Name</FormLabel>
                                <Input
                                  placeholder="e.g. Remove Skin, Remove Head, Marination Pack"
                                  className="h-9 mt-1 text-sm font-medium"
                                  {...form.register(`extra_options.${index}.name`)}
                                />
                              </div>

                              <div className="md:col-span-3">
                                <FormLabel className="text-xs font-semibold">Price Add (₹)</FormLabel>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="h-9 mt-1 text-xs font-bold"
                                  {...form.register(`extra_options.${index}.price_adjustment`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </div>

                              <div className="md:col-span-3 flex items-center gap-2 pt-4">
                                <Switch
                                  checked={form.watch(`extra_options.${index}.is_default`)}
                                  onCheckedChange={(checked) => form.setValue(`extra_options.${index}.is_default`, checked)}
                                />
                                <span className="text-xs text-muted-foreground">Pre-checked</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4. RECIPES & COOKING IDEAS */}
                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-emerald-500" />
                        Chef&apos;s Recipe Ideas
                      </CardTitle>
                      <CardDescription>
                        Inspire customers with recipe cards shown on the product page.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        appendRecipe({
                          id: `recipe_${Date.now()}`,
                          title: "Andhra Style Fish Curry (Chepala Pulusu)",
                          description: "Traditional spicy and tangy tamarind gravy with fenugreek aroma.",
                          prep_time: "25 mins",
                          image_url: "",
                        });
                      }}
                      className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Recipe Idea
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recipeFields.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded-xl bg-muted/10">
                        <ChefHat className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No recipe ideas added.</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          If empty, the &quot;Recipe Ideas&quot; section is hidden in the customer app.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recipeFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 rounded-xl border border-border bg-background/50 relative group space-y-3"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 right-3 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
                              onClick={() => removeRecipe(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="md:col-span-2">
                                <FormLabel className="text-xs font-semibold">Recipe Title</FormLabel>
                                <Input
                                  placeholder="e.g. Traditional Andhra Chepala Pulusu"
                                  className="h-9 mt-1 text-sm font-medium"
                                  {...form.register(`recipes.${index}.title`)}
                                />
                              </div>
                              <div>
                                <FormLabel className="text-xs font-semibold">Prep / Cook Time</FormLabel>
                                <Input
                                  placeholder="e.g. 25 mins"
                                  className="h-9 mt-1 text-xs"
                                  {...form.register(`recipes.${index}.prep_time`)}
                                />
                              </div>
                            </div>

                            <div>
                              <FormLabel className="text-xs font-semibold">Recipe Description / Cooking Tip</FormLabel>
                              <Textarea
                                placeholder="Describe the key steps or flavor profile..."
                                className="min-h-[60px] mt-1 text-xs"
                                {...form.register(`recipes.${index}.description`)}
                              />
                            </div>

                            <div>
                              <FormLabel className="text-xs font-semibold">Recipe Image URL (Optional)</FormLabel>
                              <Input
                                placeholder="https://..."
                                className="h-8 mt-1 text-xs font-mono"
                                {...form.register(`recipes.${index}.image_url`)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: PRICING & STOCK */}
              <TabsContent value="pricing" className="space-y-6 mt-6">
                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Base Product Pricing</CardTitle>
                    <CardDescription>Set the main base price for this product ({currentValues.weight || "1"} {currentValues.unit || "kg"}).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="mrp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">MRP (Maximum Retail Price) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0"
                                {...field} 
                                value={field.value !== undefined && field.value !== null ? field.value : ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="selling_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Selling Price *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0"
                                {...field} 
                                value={field.value !== undefined && field.value !== null ? field.value : ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Weight / Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                {...field} 
                                value={field.value !== undefined ? field.value : 1}
                                onChange={(e) => field.onChange(e.target.value === "" ? 1 : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit of Measure</FormLabel>
                            <Select onValueChange={(val) => field.onChange(val || "kg")} value={field.value || "kg"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kg">kg (Kilograms)</SelectItem>
                                <SelectItem value="gms">gms (Grams)</SelectItem>
                                <SelectItem value="pc">pc (Piece / Count)</SelectItem>
                                <SelectItem value="pack">pack (Packet / Box)</SelectItem>
                                <SelectItem value="litre">litre (Liters)</SelectItem>
                                <SelectItem value="bunch">bunch (Leafy bunch)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle>Additional Size Variants (Optional)</CardTitle>
                      <CardDescription>Add size options like 500gms, 250gms with individual prices.</CardDescription>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const baseMrp = Number(currentValues.mrp) || 0;
                        const baseSp = Number(currentValues.selling_price) || 0;
                        appendVariant({ 
                          weight: 500, 
                          unit: "gms", 
                          mrp: baseMrp > 0 ? Math.round(baseMrp / 2) : 0, 
                          selling_price: baseSp > 0 ? Math.round(baseSp / 2) : 0, 
                          stock: Number(currentValues.stock) || 10 
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Size Variant
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {variantFields.length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-4 border rounded-lg bg-muted/20">
                        No additional size variants. Base product ({currentValues.weight || "1"} {currentValues.unit || "kg"}) will be offered.
                      </p>
                    )}
                    {variantFields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-background/50 relative group">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-background border text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-5 gap-4 flex-1">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.weight`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Weight</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="500"
                                    {...field} 
                                    value={field.value !== undefined && field.value !== null ? field.value : ""}
                                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Unit</FormLabel>
                                <FormControl>
                                  <Input placeholder="gms" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.mrp`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">MRP</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0"
                                    {...field} 
                                    value={field.value !== undefined && field.value !== null ? field.value : ""}
                                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.selling_price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Selling Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0"
                                    {...field} 
                                    value={field.value !== undefined && field.value !== null ? field.value : ""}
                                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.stock`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Stock</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0"
                                    {...field} 
                                    value={field.value !== undefined && field.value !== null ? field.value : ""}
                                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Inventory Management</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value !== undefined ? field.value : 50}
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="minimum_stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value !== undefined ? field.value : 5}
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: MEDIA GALLERY */}
              <TabsContent value="media" className="space-y-6 mt-6">
                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Media Gallery</CardTitle>
                    <CardDescription>Upload product images. The first image will be used as the thumbnail.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ImageUpload
                              value={field.value || []}
                              onChange={field.onChange}
                              bucket="products"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 5: SETTINGS & SEO */}
              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Visibility & Badges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="is_available"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Product</FormLabel>
                            <FormDescription>
                              If disabled, this product will be hidden from the customer app.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_unique"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800 p-4 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                              ✨ Unique for You
                            </FormLabel>
                            <FormDescription className="text-indigo-700/80 dark:text-indigo-300/70">
                              If enabled, this product will be featured prominently in the &quot;Unique for You&quot; section on the home page.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="labels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Badges / Labels</FormLabel>
                          <FormDescription>
                            e.g. Fresh, Sea Catch, Premium, Limited Stock
                          </FormDescription>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Fresh, Sea Catch, Premium" 
                              value={field.value?.join(", ") || ""} 
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val ? val.split(",").map(v => v.trim()).filter(Boolean) : []);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="search_tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Search Keywords & Tags</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. vanjaram, seer fish, king fish, anjal, fish curry" 
                              {...field} 
                              value={field.value ?? ""} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>

      {/* MOBILE PREVIEW */}
      <MobilePreview title="Customer App Preview">
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900 min-h-full pb-10">
          <div className="relative aspect-[4/3] bg-white dark:bg-black overflow-hidden shadow-sm group">
            {currentValues.images && currentValues.images.length > 0 ? (
              <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {currentValues.images.map((img: string, idx: number) => (
                  <div key={idx} className="min-w-full h-full snap-center relative">
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 bg-muted/30">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-xs">No image provided</span>
              </div>
            )}
            
            {currentValues.images && currentValues.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-md">
                {currentValues.images.map((_, idx) => (
                  <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/80" />
                ))}
              </div>
            )}
            
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {currentValues.labels && currentValues.labels.map((lbl: string, idx: number) => (
                <div key={idx} className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm backdrop-blur-md inline-flex self-start">
                  {lbl}
                </div>
              ))}
              {previewDisplay.discount > 0 && (
                <div className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm backdrop-blur-md inline-flex self-start">
                  {previewDisplay.discount}% OFF
                </div>
              )}
            </div>
            
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 p-2 rounded-full shadow-md backdrop-blur-md">
              <Share2 className="w-4 h-4 text-foreground" />
            </div>
          </div>
          
          <div className="p-4 flex flex-col gap-3">
            {/* Title & Unit */}
            <div>
              <h3 className="font-bold text-base leading-tight text-foreground line-clamp-2">
                {currentValues.name || "Product Title"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {previewDisplay.unitStr}
              </p>
            </div>
            
            {/* Price line */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                ₹{previewDisplay.sp}
              </span>
              {previewDisplay.mrp > previewDisplay.sp && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{previewDisplay.mrp}
                </span>
              )}
            </div>

            {/* DYNAMIC INFO STRIP (Reflows neatly based on active fields) */}
            {activeInfoFields.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {activeInfoFields.map((f, i) => {
                  const IconComp = getIconComponent(f.icon);
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground block truncate">{f.label || "Info"}</span>
                        <span className="text-xs font-bold text-foreground block truncate">{f.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SIZE VARIANTS */}
            {currentValues.variants && currentValues.variants.length > 0 && (
              <div className="mt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Select Size</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedVariantIdx("base")}
                    className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedVariantIdx === "base"
                        ? "bg-emerald-500 text-white font-bold border-emerald-500 shadow-sm"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {currentValues.weight || "1"}{currentValues.unit || "kg"} - ₹{currentValues.selling_price || 0}
                  </button>
                  {currentValues.variants.map((v: any, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedVariantIdx(i)}
                      className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedVariantIdx === i
                          ? "bg-emerald-500 text-white font-bold border-emerald-500 shadow-sm"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {v.weight || ""}{v.unit || "gms"} - ₹{v.selling_price || 0}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PREPARATION / CUT SELECTOR ("How do you want it?") */}
            {currentValues.prep_options && currentValues.prep_options.filter(p => p.name?.trim()).length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">How do you want it?</p>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">Choose 1</span>
                </div>
                <div className="space-y-1.5">
                  {currentValues.prep_options.filter(p => p.name?.trim()).map((prep, pIdx) => {
                    const isSelected = previewSelectedPrepIdx === pIdx;
                    return (
                      <div
                        key={pIdx}
                        onClick={() => setPreviewSelectedPrepIdx(pIdx)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm"
                            : "bg-white dark:bg-card border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="pt-0.5">
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{prep.name}</span>
                            {Number(prep.price_adjustment) > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600">+₹{prep.price_adjustment}</span>
                            )}
                          </div>
                          {prep.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{prep.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EXTRA OPTIONS (Checkboxes) */}
            {currentValues.extra_options && currentValues.extra_options.filter(e => e.name?.trim()).length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Extra Options</p>
                <div className="space-y-1.5">
                  {currentValues.extra_options.filter(e => e.name?.trim()).map((extra, eIdx) => {
                    const isChecked = !!previewSelectedExtras[eIdx];
                    return (
                      <div
                        key={eIdx}
                        onClick={() => {
                          setPreviewSelectedExtras(prev => ({ ...prev, [eIdx]: !prev[eIdx] }));
                        }}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500"
                            : "bg-white dark:bg-card border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-muted-foreground/50"}`}>
                            {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs font-medium text-foreground">{extra.name}</span>
                        </div>
                        {Number(extra.price_adjustment) > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-600">+₹{extra.price_adjustment}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Free</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description block */}
            <div className="mt-2 p-3 bg-white dark:bg-card border rounded-xl shadow-sm">
              <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-1.5">Description</h4>
              {currentValues.description ? (
                <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {currentValues.description}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No detailed description.</p>
              )}
            </div>

            {/* CHEF'S RECIPES */}
            {currentValues.recipes && currentValues.recipes.filter(r => r.title?.trim()).length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-emerald-600" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Chef&apos;s Recipe Ideas</p>
                </div>
                <div className="space-y-2">
                  {currentValues.recipes.filter(r => r.title?.trim()).map((rec, rIdx) => (
                    <div key={rIdx} className="p-3 bg-white dark:bg-card border rounded-xl shadow-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-foreground">{rec.title}</h5>
                        {rec.prep_time && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {rec.prep_time}
                          </span>
                        )}
                      </div>
                      {rec.description && (
                        <p className="text-[11px] text-muted-foreground leading-snug">{rec.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shelf life & origin */}
            {(currentValues.shelf_life || currentValues.country_of_origin) && (
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl border">
                {currentValues.shelf_life && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Shelf Life</span>
                    <span className="font-semibold text-foreground">{currentValues.shelf_life}</span>
                  </div>
                )}
                {currentValues.country_of_origin && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Origin</span>
                    <span className="font-semibold text-foreground">{currentValues.country_of_origin}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </MobilePreview>
    </div>
  );
}

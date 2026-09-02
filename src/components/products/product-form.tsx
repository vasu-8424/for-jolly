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
import { ImageIcon, Share2, Heart, Loader2, ArrowLeft, Plus, Trash2, Tag, Layers } from "lucide-react";
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
      }))
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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | "base">("base");

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

  // Auto slug generator from Name if slug is empty
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
      let result;
      if (initialData?.id) {
        result = await updateProduct(initialData.id, values);
      } else {
        result = await createProduct(values);
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
    } else if (errors.mrp || errors.selling_price || errors.stock || errors.sku || errors.barcode || errors.variants) {
      setActiveTab("pricing");
    } else if (errors.images) {
      setActiveTab("media");
    } else {
      setActiveTab("settings");
    }

    // Get the first specific error message
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
    if (
      selectedVariantIdx !== "base" &&
      currentValues.variants &&
      currentValues.variants[selectedVariantIdx]
    ) {
      const v = currentValues.variants[selectedVariantIdx];
      const sp = Number(v.selling_price) > 0 ? Number(v.selling_price) : (Number(currentValues.selling_price) || 0);
      const m = Number(v.mrp) > 0 ? Number(v.mrp) : (Number(currentValues.mrp) || 0);
      const unitStr = `${v.weight ?? ""} ${v.unit ?? ""}`.trim() || `${currentValues.weight || "1"} ${currentValues.unit || "kg"}`;
      const discount = m > sp && m > 0 ? Math.round(((m - sp) / m) * 100) : 0;
      return { sp, mrp: m, unitStr, discount };
    }

    // Base Product values
    const sp = Number(currentValues.selling_price) || 0;
    const m = Number(currentValues.mrp) || 0;
    const unitStr = `${currentValues.weight || "1"} ${currentValues.unit || "kg"}`.trim();
    const discount = m > sp && m > 0 ? Math.round(((m - sp) / m) * 100) : 0;
    return { sp, mrp: m, unitStr, discount };
  })();

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
                    {initialData ? "Modify product details and variants" : "Create a new catalog item for mobile app"}
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
              <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-card border shadow-sm">
                <TabsTrigger value="general">General Info</TabsTrigger>
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
                              placeholder="e.g. Fresh Organic Tomatoes" 
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
                          <FormLabel>Full Description (Telugu / English Item Breakdown)</FormLabel>
                          <FormControl>
                            <Textarea 
                              className="min-h-[160px] font-sans" 
                              placeholder="ఉల్లిపాయ – 1 kg&#10;బంగాళాదుంప – 1/2 kg&#10;టమోటా – 1/2 kg..." 
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
                              <Input placeholder="e.g. 1 week, 6 Months" {...field} value={field.value ?? ""} />
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
                            <FormLabel>Country of Origin</FormLabel>
                            <FormControl>
                              <Input placeholder="India" {...field} value={field.value ?? ""} />
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
                          <FormLabel>Ingredients</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Natural, 100% Farm Fresh..." {...field} value={field.value || ""} />
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
                            <Textarea placeholder="Energy, Protein, Carbs, Vitamin C..." {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: PRICING & STOCK */}
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
                        append({ 
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
                    {fields.length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-4 border rounded-lg bg-muted/20">
                        No additional variants. Base product ({currentValues.weight || "1"} {currentValues.unit || "kg"}) will be offered.
                      </p>
                    )}
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-background/50 relative group">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-background border text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                          onClick={() => remove(index)}
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

              {/* TAB 3: MEDIA GALLERY */}
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

              {/* TAB 4: SETTINGS & SEO */}
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
                            e.g. Fresh, Organic, Bestseller, Limited Stock, Flash Sale
                          </FormDescription>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Fresh, Organic, Bestseller" 
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
                              placeholder="e.g. vegetables, combo, daily basket, family pack" 
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

      <MobilePreview title="App Preview">
        {/* Flutter App Product Card Preview UI */}
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900 min-h-full">
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
          
          <div className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-2">
                  {currentValues.name || "Product Title"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {previewDisplay.unitStr}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
                ₹{previewDisplay.sp}
              </span>
              {previewDisplay.mrp > previewDisplay.sp && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{previewDisplay.mrp}
                </span>
              )}
            </div>

            {currentValues.variants && currentValues.variants.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Available Sizes</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVariantIdx("base")}
                    className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedVariantIdx === "base"
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
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
                      className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedVariantIdx === i
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {v.weight || ""}{v.unit || "gms"} - ₹{v.selling_price || 0}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Description block (formatted item list) */}
            <div className="mt-4 p-3 bg-white dark:bg-card border rounded-xl shadow-sm">
              <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">Description</h4>
              {currentValues.description ? (
                <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {currentValues.description}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No detailed description.</p>
              )}
            </div>

            {/* Shelf life & origin */}
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl border">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Shelf Life</span>
                <span className="font-semibold text-foreground">{currentValues.shelf_life || "1 week"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Origin</span>
                <span className="font-semibold text-foreground">{currentValues.country_of_origin || "India"}</span>
              </div>
              {currentValues.ingredients && (
                <div className="col-span-2 mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Ingredients</span>
                  <span className="text-foreground">{currentValues.ingredients}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </MobilePreview>
    </div>
  );
}

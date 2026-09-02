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
import { ImageIcon, Share2, Heart, Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
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
      ...initialData, 
      search_tags: Array.isArray(initialData.search_tags) ? initialData.search_tags.join(", ") : (initialData.search_tags || ""),
      subcategory_id: initialData.subcategory_id || "",
      description: initialData.description || "",
      short_description: initialData.short_description || "",
      brand: initialData.brand || "",
      barcode: initialData.barcode || "",
      unit: initialData.unit || "gms",
      shelf_life: initialData.shelf_life || "",
      ingredients: initialData.ingredients || "",
      nutrition_info: initialData.nutrition_info || "",
      is_unique: initialData.is_unique || (Array.isArray(initialData.labels) && initialData.labels.includes("Unique")),
      variants: initialData.variants || [] 
    } : {
      name: "",
      slug: "",
      description: "",
      short_description: "",
      mrp: 0,
      selling_price: 0,
      discount_percentage: 0,
      gst_percentage: 0,
      category_id: "",
      subcategory_id: "",
      brand: "",
      sku: "",
      barcode: "",
      stock: 0,
      minimum_stock: 5,
      weight: 0,
      unit: "kg",
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
    toast.error("Please fill in all required fields correctly. Check the form for red error messages.");
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
    <div className="flex gap-6 h-full max-w-7xl mx-auto">
      <div className="flex-1 min-w-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
            <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-heading font-bold">
              {initialData ? "Edit Product" : "Add New Product"}
            </h1>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Discard</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Product
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-card border shadow-sm">
            <TabsTrigger value="general">General Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
            <TabsTrigger value="media">Media Gallery</TabsTrigger>
            <TabsTrigger value="settings">Settings & SEO</TabsTrigger>
          </TabsList>

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
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Fresh Organic Tomatoes" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="fresh-organic-tomatoes" {...field} value={field.value ?? ""} />
                      </FormControl>
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
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[150px]" placeholder="Detailed product information..." {...field} value={field.value ?? ""} />
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
                          <Input placeholder="e.g. 6 Months" {...field} value={field.value ?? ""} />
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
                        <Textarea placeholder="List of ingredients..." {...field} value={field.value || ""} />
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
                        <Textarea placeholder="Energy, Protein, Carbs..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6 mt-6">
            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Pricing Strategy</CardTitle>
                <CardDescription>Set the main base price for this product ({currentValues.weight || "1"} {currentValues.unit || "kg"}).</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mrp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MRP (Maximum Retail Price)</FormLabel>
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
                      <FormLabel>Selling Price</FormLabel>
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
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>Additional Size Variants</CardTitle>
                  <CardDescription>Add options like 500gms, 250gms with specific pricing.</CardDescription>
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
                  Add Variant
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-4 border rounded-lg bg-muted/20">No additional variants added.</p>
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
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                      <FormControl>
                        <Input placeholder="TOM-ORG-001" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode (ISBN, UPC, GTIN)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 8901234567890" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel>Low Stock Alert Threshold</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
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

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Visibility & Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={(val) => field.onChange(val)} value={field.value || ""}>
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
                  name="is_available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Product</FormLabel>
                        <FormDescription>
                          If disabled, this product will be hidden from the store.
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
                      <FormLabel>Product Labels (Comma separated)</FormLabel>
                      <FormDescription>
                        Valid labels: New, Fresh, Organic, Premium, Bestseller, Trending, Recommended, Limited Stock, Hot Deal, Flash Sale
                      </FormDescription>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Fresh, Organic, Bestseller" 
                          value={field.value?.join(", ") || ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? val.split(",").map(v => v.trim()) : []);
                          }}
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
                      {v.weight || "0"}{v.unit || "gms"} - ₹{v.selling_price || 0}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-white dark:bg-card rounded-xl border shadow-sm space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1 text-foreground">Description</p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {currentValues.short_description && (
                    <span className="block mb-2 text-sm text-foreground/90">{currentValues.short_description}</span>
                  )}
                  {currentValues.description || (!currentValues.short_description && "Detailed product description will appear here...")}
                </p>
              </div>
              
              {(currentValues.shelf_life || currentValues.country_of_origin || currentValues.ingredients) && (
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-3 border-t">
                  {currentValues.shelf_life && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Shelf Life</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{currentValues.shelf_life}</p>
                    </div>
                  )}
                  {currentValues.country_of_origin && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Origin</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{currentValues.country_of_origin}</p>
                    </div>
                  )}
                  {currentValues.ingredients && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Ingredients</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{currentValues.ingredients}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 pb-0 sticky bottom-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-t p-4 -mx-4 -mb-4 flex items-center gap-3 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              <button type="button" className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-white dark:bg-card rounded-xl border shadow-sm text-muted-foreground hover:text-red-500 hover:border-red-200 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              
              <div className="flex-1 h-12 bg-primary rounded-xl flex items-center justify-between px-1 shadow-lg shadow-primary/20 text-primary-foreground">
                <button type="button" className="w-10 h-10 flex items-center justify-center font-bold text-xl rounded-lg hover:bg-white/20 transition-colors">-</button>
                <span className="font-bold">1</span>
                <button type="button" className="w-10 h-10 flex items-center justify-center font-bold text-xl rounded-lg hover:bg-white/20 transition-colors">+</button>
              </div>
            </div>
          </div>
        </div>
      </MobilePreview>
    </div>
  );
}

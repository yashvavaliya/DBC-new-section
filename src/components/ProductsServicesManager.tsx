import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  Upload,
  Bold,
  Italic,
  List,
  Link,
  Phone,
  MessageCircle,
  Mail,
  Save,
  Trash2,
  Image as ImageIcon,
  Star,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ImageUpload } from './ImageUpload';

interface ProductService {
  id: string;
  title: string;
  description: string;
  price?: string;
  category?: string;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  images: ProductImage[];
  inquiries: ProductInquiry[];
}

interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
}

interface ProductInquiry {
  id: string;
  inquiry_type: 'link' | 'phone' | 'whatsapp' | 'email';
  contact_value: string;
  button_text: string;
  is_active: boolean;
}

interface ProductsServicesManagerProps {
  cardId: string;
  products: ProductService[];
  onProductsChange: (products: ProductService[]) => void;
  userId: string;
}

export const ProductsServicesManager: React.FC<ProductsServicesManagerProps> = ({
  cardId,
  products,
  onProductsChange,
  userId
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<ProductService>>({
    title: '',
    description: '',
    price: '',
    category: '',
    is_featured: false,
    is_active: true,
    images: [],
    inquiries: []
  });

  useEffect(() => {
    if (cardId) {
      loadProducts();
    }
  }, [cardId]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products_services')
        .select('*')
        .eq('card_id', cardId)
        .order('display_order', { ascending: true });

      if (productsError) throw productsError;

      // Load images and inquiries for each product
      const productsWithDetails = await Promise.all(
        (productsData || []).map(async (product) => {
          // Load images
          const { data: imagesData } = await supabase
            .from('product_images')
            .select('*')
            .eq('product_id', product.id)
            .order('display_order', { ascending: true });

          // Load inquiries
          const { data: inquiriesData } = await supabase
            .from('product_inquiries')
            .select('*')
            .eq('product_id', product.id);

          return {
            ...product,
            images: imagesData || [],
            inquiries: inquiriesData || []
          };
        })
      );

      onProductsChange(productsWithDetails);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (productData: Partial<ProductService>) => {
    try {
      setSaving(true);

      let productId: string;

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products_services')
          .update({
            title: productData.title,
            description: productData.description,
            price: productData.price,
            category: productData.category,
            is_featured: productData.is_featured,
            is_active: productData.is_active
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products_services')
          .insert({
            card_id: cardId,
            title: productData.title,
            description: productData.description,
            price: productData.price,
            category: productData.category,
            display_order: products.length,
            is_featured: productData.is_featured || false,
            is_active: productData.is_active !== false
          })
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      }

      // Save inquiries
      if (productData.inquiries && productData.inquiries.length > 0) {
        // Delete existing inquiries
        await supabase
          .from('product_inquiries')
          .delete()
          .eq('product_id', productId);

        // Insert new inquiries
        const { error: inquiriesError } = await supabase
          .from('product_inquiries')
          .insert(
            productData.inquiries.map(inquiry => ({
              product_id: productId,
              inquiry_type: inquiry.inquiry_type,
              contact_value: inquiry.contact_value,
              button_text: inquiry.button_text,
              is_active: inquiry.is_active
            }))
          );

        if (inquiriesError) throw inquiriesError;
      }

      await loadProducts();
      setShowAddForm(false);
      setEditingProduct(null);
      setNewProduct({
        title: '',
        description: '',
        price: '',
        category: '',
        is_featured: false,
        is_active: true,
        images: [],
        inquiries: []
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product/service? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products_services')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleAddImage = async (productId: string, imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          display_order: 0,
          is_primary: false
        });

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Failed to add image. Please try again.');
    }
  };

  const formatText = (text: string, format: 'bold' | 'italic' | 'bullet') => {
    const textarea = document.getElementById('description-input') as HTMLTextAreaElement;
    if (!textarea) return text;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);

    if (!selectedText) return text;

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'bullet':
        formattedText = `• ${selectedText}`;
        break;
    }

    return text.substring(0, start) + formattedText + text.substring(end);
  };

  const renderProductForm = (product: Partial<ProductService>) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {editingProduct ? 'Edit Product/Service' : 'Add New Product/Service'}
        </h3>
        <button
          onClick={() => {
            setShowAddForm(false);
            setEditingProduct(null);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={product.title || ''}
              onChange={(e) => setNewProduct({ ...product, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Product or service name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (Optional)
            </label>
            <input
              type="text"
              value={product.price || ''}
              onChange={(e) => setNewProduct({ ...product, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="$99 or Contact for pricing"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category (Optional)
          </label>
          <input
            type="text"
            value={product.category || ''}
            onChange={(e) => setNewProduct({ ...product, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Web Design, Consulting, Products"
          />
        </div>

        {/* Rich Text Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Formatting Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2">
              <button
                type="button"
                onClick={() => setNewProduct({ 
                  ...product, 
                  description: formatText(product.description || '', 'bold') 
                })}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setNewProduct({ 
                  ...product, 
                  description: formatText(product.description || '', 'italic') 
                })}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setNewProduct({ 
                  ...product, 
                  description: formatText(product.description || '', 'bullet') 
                })}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Bullet Point"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <textarea
              id="description-input"
              value={product.description || ''}
              onChange={(e) => setNewProduct({ ...product, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none resize-none"
              placeholder="Describe your product or service. Use **bold**, *italic*, and • bullet points for formatting."
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use **text** for bold, *text* for italic, and • for bullet points
          </p>
        </div>

        {/* Inquiry Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inquiry Buttons
          </label>
          <div className="space-y-3">
            {(product.inquiries || []).map((inquiry, index) => (
              <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <select
                  value={inquiry.inquiry_type}
                  onChange={(e) => {
                    const updatedInquiries = [...(product.inquiries || [])];
                    updatedInquiries[index] = {
                      ...inquiry,
                      inquiry_type: e.target.value as any
                    };
                    setNewProduct({ ...product, inquiries: updatedInquiries });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="link">Website Link</option>
                  <option value="phone">Phone Number</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
                <input
                  type="text"
                  value={inquiry.contact_value}
                  onChange={(e) => {
                    const updatedInquiries = [...(product.inquiries || [])];
                    updatedInquiries[index] = {
                      ...inquiry,
                      contact_value: e.target.value
                    };
                    setNewProduct({ ...product, inquiries: updatedInquiries });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact value (URL, phone, etc.)"
                />
                <input
                  type="text"
                  value={inquiry.button_text}
                  onChange={(e) => {
                    const updatedInquiries = [...(product.inquiries || [])];
                    updatedInquiries[index] = {
                      ...inquiry,
                      button_text: e.target.value
                    };
                    setNewProduct({ ...product, inquiries: updatedInquiries });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Button text"
                />
                <button
                  onClick={() => {
                    const updatedInquiries = (product.inquiries || []).filter((_, i) => i !== index);
                    setNewProduct({ ...product, inquiries: updatedInquiries });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newInquiry: ProductInquiry = {
                  id: '',
                  inquiry_type: 'link',
                  contact_value: '',
                  button_text: 'Inquire Now',
                  is_active: true
                };
                setNewProduct({ 
                  ...product, 
                  inquiries: [...(product.inquiries || []), newInquiry] 
                });
              }}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Inquiry Button
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.is_featured || false}
              onChange={(e) => setNewProduct({ ...product, is_featured: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Featured Product</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.is_active !== false}
              onChange={(e) => setNewProduct({ ...product, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleSaveProduct(product)}
            disabled={!product.title || !product.description || saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Product'}
          </button>
          <button
            onClick={() => {
              setShowAddForm(false);
              setEditingProduct(null);
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Products & Services</h3>
          <p className="text-sm text-gray-600">
            Showcase your products and services with rich descriptions and inquiry options
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product/Service
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingProduct) && renderProductForm(editingProduct || newProduct)}

      {/* Products List */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{product.title}</h4>
                      {product.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      {!product.is_active && (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    {product.price && (
                      <p className="text-sm text-green-600 font-medium mb-1">{product.price}</p>
                    )}
                    {product.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        <Tag className="w-3 h-3" />
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setNewProduct(product);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {product.description.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
                </div>

                {product.inquiries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.inquiries.map((inquiry, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {inquiry.inquiry_type === 'link' && <Link className="w-3 h-3" />}
                        {inquiry.inquiry_type === 'phone' && <Phone className="w-3 h-3" />}
                        {inquiry.inquiry_type === 'whatsapp' && <MessageCircle className="w-3 h-3" />}
                        {inquiry.inquiry_type === 'email' && <Mail className="w-3 h-3" />}
                        {inquiry.button_text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products or Services</h3>
          <p className="text-gray-600 mb-4">
            Add your products and services to showcase what you offer to potential customers.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Product/Service
          </button>
        </div>
      )}

      {/* Summary */}
      {products.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {products.length} product{products.length !== 1 ? 's' : ''} • {products.filter(p => p.is_featured).length} featured
              </span>
            </div>
            <span className="text-sm text-blue-700">
              {products.filter(p => p.is_active).length} active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
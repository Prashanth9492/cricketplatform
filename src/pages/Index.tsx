import { HeroSection } from "@/components/HeroSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Calendar, Trophy, TrendingUp, Users, Star, Camera, ArrowRight, Image } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

type GalleryItem = {
  _id: string;
  title?: string;
  description?: string;
  category?: string;
  imageUrls: string[];
  createdAt: Date;
};

const Index = () => {
  const [recentGallery, setRecentGallery] = useState<GalleryItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  useEffect(() => {
    const fetchRecentGallery = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/galleries');
        // Get only 3 most recent items
        setRecentGallery(response.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching gallery:', error);
      } finally {
        setLoadingGallery(false);
      }
    };
    fetchRecentGallery();
  }, []);

  return (
    <div className="bg-background min-h-screen text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="space-y-8">
        <HeroSection />

        {/* Recent Gallery Section */}
        {!loadingGallery && recentGallery.length > 0 && (
          <section className="px-4 md:px-6 lg:px-8 xl:px-12 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Camera className="h-8 w-8 text-blue-600" />
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">Recent Gallery</h2>
                </div>
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-lg"
                >
                  View All
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              {/* Updated grid for larger cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {recentGallery.map((item) => (
                  <div key={item._id} className="group">
                    <Link
                      to="/gallery"
                      className="block relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-card hover:shadow-2xl transition-all duration-300 hover:border-blue-500 hover:scale-[1.02]"
                    >
                      {/* Larger aspect ratio or fixed height */}
                      <div className="aspect-[4/3] overflow-hidden">
                        {item.imageUrls && item.imageUrls.length > 0 ? (
                          <>
                            <img
                              src={`http://localhost:5001${item.imageUrls[0]}`}
                              alt={item.title || 'Gallery image'}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/600x450?text=No+Image';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute bottom-0 left-0 right-0 p-5">
                                <p className="text-white text-xl font-bold mb-2">
                                  {item.title || 'Cricket Gallery'}
                                </p>
                                {item.category && (
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm">
                                      {item.category}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.imageUrls.length > 1 && (
                              <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                                <Image className="h-4 w-4" />
                                <span className="font-medium">{item.imageUrls.length} images</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-8">
                            <Camera className="h-16 w-16 text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No Image Available</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Optional: Card footer outside the image area */}
                      <div className="p-5 bg-white dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {item.title || 'Gallery Item'}
                            </p>
                            {item.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              
              {/* Alternative: For even larger cards with full-width on mobile */}
              {/* 
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {recentGallery.slice(0, 4).map((item) => (
                  // ... same card structure but even larger
                ))}
              </div>
              */}
            </div>
          </section>
        )}

        {/* Quick Stats Dashboard */}

        {/* Featured Sections */}
      </div>
    </div>
  );
};

export default Index;
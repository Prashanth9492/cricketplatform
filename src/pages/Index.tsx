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
        // Get the 6 most recent items
        setRecentGallery(response.data.slice(0, 6));
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Camera className="h-7 w-7 text-blue-600" />
                  <h2 className="text-3xl font-bold text-foreground">Recent Gallery</h2>
                </div>
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {recentGallery.map((item) => (
                  <Link
                    key={item._id}
                    to="/gallery"
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-card hover:shadow-xl transition-all duration-300"
                  >
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <>
                        <img
                          src={`http://localhost:5001${item.imageUrls[0]}`}
                          alt={item.title || 'Gallery image'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/300x300?text=No+Image';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-sm font-semibold truncate">
                              {item.title || 'Cricket Gallery'}
                            </p>
                            {item.category && (
                              <p className="text-white/80 text-xs mt-1">{item.category}</p>
                            )}
                          </div>
                        </div>
                        {item.imageUrls.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            {item.imageUrls.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
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

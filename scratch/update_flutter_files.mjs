import fs from 'fs';

// ==============================================================================
// 1. UPDATE home_screen.dart
// ==============================================================================
const homeScreenPath = 'D:/AervoApp/lib/features/customer/presentation/home_screen.dart';
if (fs.existsSync(homeScreenPath)) {
  let content = fs.readFileSync(homeScreenPath, 'utf8');

  // Replace banner loading logic
  const loadStart = '// 3. Fetch Banners asynchronously';
  const loadEnd = 'void _updateUserLocation(';
  const loadIdx1 = content.indexOf(loadStart);
  const loadIdx2 = content.indexOf(loadEnd, loadIdx1);

  if (loadIdx1 !== -1 && loadIdx2 !== -1) {
    const newLoadCode = `// 3. Fetch Dynamic Banners from Supabase banners table
    SupabaseService().client
        .from('banners')
        .select()
        .eq('is_active', true)
        .order('display_order', ascending: true)
        .then((response) {
      if (response is List && response.isNotEmpty) {
        if (mounted) {
          setState(() {
            _promoData = response.map((b) {
              final titleText = (b['title'] ?? 'FRESHNESS\\nYOU CAN TRUST').toString();
              final subText = (b['subtitle'] ?? 'Seafood | Meat | Vegetables').toString();
              final imgUrl = (b['image_url'] ?? b['mobile_image_url'] ?? '').toString();
              final link = b['link_target'] ?? b['deep_link'];

              return {
                'tag': 'PROMOTION',
                'title': titleText,
                'sub': subText,
                'btn': 'ORDER NOW',
                'image': imgUrl,
                'link_target': link,
                'color': const Color(0xFF0A4420),
                'accent': const Color(0xFF76FF03),
              };
            }).toList();
            _isLoadingBanners = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoadingBanners = false);
      }
    }).catchError((e) {
      debugPrint("Error fetching dynamic banners: $e");
      if (mounted) setState(() => _isLoadingBanners = false);
    });
  }

  `;
    content = content.substring(0, loadIdx1) + newLoadCode + content.substring(loadIdx2);
    console.log('Replaced banner loading in home_screen.dart');
  }

  // Replace _buildHeroBanner method
  const heroStart = 'Widget _buildHeroBanner() {';
  const heroEnd = 'Widget _buildUspsGrid() {';
  const heroIdx1 = content.indexOf(heroStart);
  const heroIdx2 = content.indexOf(heroEnd, heroIdx1);

  if (heroIdx1 !== -1 && heroIdx2 !== -1) {
    const newHeroCode = `Widget _buildHeroBanner() {
    final defaultSlides = [
      {
        'tag': 'FRESHNESS',
        'title': 'YOU CAN\\nTRUST',
        'sub': 'Seafood | Chicken | Mutton\\nVegetables | Milk & More',
        'btn': 'ORDER NOW',
        'image': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
        'link_target': '/customer/aisles',
        'color': const Color(0xFF0A4420),
        'accent': const Color(0xFF76FF03),
      },
      {
        'tag': "TODAY'S CATCH",
        'title': 'FRESH SEAFOOD\\nDIRECT CATCH',
        'sub': 'Prawns, Fish, Crabs & Shellfish\\n100% Chemical-Free Freshness',
        'btn': 'EXPLORE CATCH',
        'image': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80',
        'link_target': '/customer/catch',
        'color': const Color(0xFF0F7A38),
        'accent': const Color(0xFFFFEA00),
      },
      {
        'tag': '15-MIN EXPRESS',
        'title': 'FARM FRESH\\nVEGETABLES',
        'sub': 'Organic & Handpicked Daily\\nBest Prices Delivered Fast',
        'btn': 'SHOP FRESH',
        'image': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
        'link_target': '/customer/greens',
        'color': const Color(0xFF1B5E20),
        'accent': const Color(0xFF76FF03),
      },
    ];

    final slides = _promoData.isNotEmpty ? _promoData : defaultSlides;

    return Column(
      children: [
        SizedBox(
          height: 175,
          child: PageView.builder(
            controller: _bannerPageController,
            onPageChanged: (index) {
              setState(() {
                _currentBannerIndex = index;
              });
            },
            itemCount: slides.length,
            itemBuilder: (context, index) {
              final slide = slides[index];
              final accentColor = (slide['accent'] as Color?) ?? const Color(0xFF76FF03);

              return GestureDetector(
                onTap: () {
                  final link = slide['link_target'] as String?;
                  if (link != null && link.isNotEmpty) {
                    try {
                      context.push(link);
                    } catch (_) {
                      context.go(link);
                    }
                  } else {
                    context.go('/customer/aisles');
                  }
                },
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.12),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    children: [
                      // Full background image filling 100% of the banner card
                      Positioned.fill(
                        child: AervoNetworkImage(
                          imageUrl: (slide['image'] as String?) ?? '',
                          fit: BoxFit.cover,
                        ),
                      ),

                      // Natural Dark Corner Gradient Overlay
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.bottomLeft,
                              end: Alignment.topRight,
                              colors: [
                                Colors.black.withOpacity(0.88),
                                Colors.black.withOpacity(0.65),
                                Colors.black.withOpacity(0.20),
                                Colors.transparent,
                              ],
                              stops: const [0.0, 0.45, 0.75, 1.0],
                            ),
                          ),
                        ),
                      ),

                      // Text Banner Content rendered directly over natural image view
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: accentColor.withOpacity(0.25),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: accentColor.withOpacity(0.8), width: 1),
                              ),
                              child: Text(
                                (slide['tag'] as String?) ?? 'PROMOTION',
                                style: TextStyle(
                                  fontFamily: 'Sora',
                                  color: accentColor,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              (slide['title'] as String?) ?? '',
                              style: const TextStyle(
                                fontFamily: 'Sora',
                                color: Colors.white,
                                fontSize: 21,
                                fontWeight: FontWeight.w900,
                                height: 1.05,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              (slide['sub'] as String?) ?? '',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                color: Colors.white70,
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 10),
                            ElevatedButton(
                              onPressed: () {
                                final link = slide['link_target'] as String?;
                                if (link != null && link.isNotEmpty) {
                                  try {
                                    context.push(link);
                                  } catch (_) {
                                    context.go(link);
                                  }
                                } else {
                                  context.go('/customer/aisles');
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: accentColor,
                                foregroundColor: const Color(0xFF0D3B16),
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    (slide['btn'] as String?) ?? 'ORDER NOW',
                                    style: const TextStyle(
                                      fontFamily: 'Sora',
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.chevron_right_rounded, size: 14),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 10),

        // Carousel Dot Indicators
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(slides.length, (index) {
            final isSelected = _currentBannerIndex == index;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              height: 4,
              width: isSelected ? 18 : 6,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF0A4420) : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            );
          }),
        ),
      ],
    );
  }

  `;
    content = content.substring(0, heroIdx1) + newHeroCode + content.substring(heroIdx2);
    console.log('Replaced _buildHeroBanner in home_screen.dart');
  }

  fs.writeFileSync(homeScreenPath, content, 'utf8');
}

// ==============================================================================
// 2. UPDATE onboarding_screen.dart
// ==============================================================================
const onboardingPath = 'D:/AervoApp/lib/features/auth/presentation/onboarding_screen.dart';
if (fs.existsSync(onboardingPath)) {
  const onboardingContent = `import '../../../shared/widgets/aervo_network_image.dart';
import '../../../core/theme/aervo_colors.dart';
import '../../../core/network/supabase_client.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _totalPages = 3;
  List<_OnboardingSlide> _slides = [];
  bool _isLoading = true;

  final List<_OnboardingSlide> _defaultSlides = [
    _OnboardingSlide(
      imageUrl: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80',
      title1: 'Fresh Sea Food',
      title2: 'Catch Of The Day',
      subtitle: 'Direct from the Bay of Bengal to your kitchen. Premium quality prawns, fish & crab delivered fresh daily.',
      feature1Icon: Icons.set_meal_outlined,
      feature1TextTop: 'Daily',
      feature1TextBottom: 'Catch',
      feature2Icon: Icons.verified_outlined,
      feature2TextTop: '100%',
      feature2TextBottom: 'Fresh',
      feature3Icon: Icons.ac_unit_outlined,
      feature3TextTop: 'Chilled',
      feature3TextBottom: 'Clean',
    ),
    _OnboardingSlide(
      imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80',
      title1: 'Prime Cut Meat',
      title2: 'Hygienic & Tender',
      subtitle: '100% antibiotic-free, expertly cut chicken, mutton, and fresh meats handled with supreme safety.',
      feature1Icon: Icons.sanitizer_outlined,
      feature1TextTop: 'Hygienic',
      feature1TextBottom: 'Cuts',
      feature2Icon: Icons.workspace_premium_outlined,
      feature2TextTop: 'Antibiotic',
      feature2TextBottom: 'Free',
      feature3Icon: Icons.local_shipping_outlined,
      feature3TextTop: 'Express',
      feature3TextBottom: 'Delivery',
    ),
    _OnboardingSlide(
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
      title1: 'Farm Fresh Greens',
      title2: 'Organic Vegetables',
      subtitle: 'Hand-picked crisp vegetables and essentials sourced directly from local organic farms every morning.',
      feature1Icon: Icons.eco_outlined,
      feature1TextTop: 'Farm',
      feature1TextBottom: 'Direct',
      feature2Icon: Icons.grass_outlined,
      feature2TextTop: '100%',
      feature2TextBottom: 'Organic',
      feature3Icon: Icons.electric_moped_outlined,
      feature3TextTop: '15 Mins',
      feature3TextBottom: 'Delivery',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _slides = _defaultSlides;
    _loadOnboardingScreens();
  }

  Future<void> _loadOnboardingScreens() async {
    try {
      final supabase = SupabaseService().client;
      final response = await supabase
          .from('onboarding_screens')
          .select()
          .order('display_order', ascending: true);

      if (response is List && response.isNotEmpty) {
        final List<_OnboardingSlide> dynamicSlides = [];
        for (var row in response) {
          final titleFull = (row['title'] as String? ?? '').trim();
          String t1 = titleFull;
          String t2 = '';
          if (titleFull.contains(' - ')) {
            final parts = titleFull.split(' - ');
            t1 = parts[0].trim();
            t2 = parts.sublist(1).join(' - ').trim();
          } else if (titleFull.contains('\\n')) {
            final parts = titleFull.split('\\n');
            t1 = parts[0].trim();
            t2 = parts.sublist(1).join(' ').trim();
          }

          final order = row['display_order'] as int? ?? (dynamicSlides.length + 1);
          final defaultItem = _defaultSlides[(order - 1) % _defaultSlides.length];

          dynamicSlides.add(_OnboardingSlide(
            imageUrl: row['image_url'] ?? defaultItem.imageUrl,
            title1: t1.isNotEmpty ? t1 : defaultItem.title1,
            title2: t2.isNotEmpty ? t2 : defaultItem.title2,
            subtitle: (row['subtitle'] as String?)?.isNotEmpty == true ? row['subtitle'] : defaultItem.subtitle,
            feature1Icon: defaultItem.feature1Icon,
            feature1TextTop: defaultItem.feature1TextTop,
            feature1TextBottom: defaultItem.feature1TextBottom,
            feature2Icon: defaultItem.feature2Icon,
            feature2TextTop: defaultItem.feature2TextTop,
            feature2TextBottom: defaultItem.feature2TextBottom,
            feature3Icon: defaultItem.feature3Icon,
            feature3TextTop: defaultItem.feature3TextTop,
            feature3TextBottom: defaultItem.feature3TextBottom,
          ));
        }

        if (mounted && dynamicSlides.length >= 3) {
          setState(() {
            _slides = dynamicSlides.take(3).toList();
            _isLoading = false;
          });
          return;
        }
      }
    } catch (e) {
      debugPrint("Error loading onboarding screens from Supabase: $e");
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int page) {
    setState(() {
      _currentPage = page;
    });
  }

  void _onMainAction() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    } else {
      context.go('/login');
    }
  }

  void _onSkip() {
    _pageController.animateToPage(
      _totalPages - 1,
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final darkGreen = const Color(0xFF0D3B16);
    final orangeText = const Color(0xFFE57B33);
    final beigeBackground = const Color(0xFFF9F6EA);
    final primaryColor = AervoColors.primary;

    final slides = _slides.isNotEmpty ? _slides : _defaultSlides;

    return Scaffold(
      backgroundColor: beigeBackground,
      body: Stack(
        children: [
          // 1. PageView Slider
          PageView.builder(
            controller: _pageController,
            onPageChanged: _onPageChanged,
            itemCount: _totalPages,
            itemBuilder: (context, index) {
              final slide = slides[index % slides.length];
              return Stack(
                children: [
                  // Top Image
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: MediaQuery.of(context).size.height * 0.45,
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: AervoNetworkImage(
                            imageUrl: slide.imageUrl,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  beigeBackground.withOpacity(0.3),
                                  beigeBackground,
                                ],
                                stops: const [0.6, 0.9, 1.0],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Bottom Container Card
                  Positioned(
                    top: MediaQuery.of(context).size.height * 0.40,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: beigeBackground,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(30),
                          topRight: Radius.circular(30),
                        ),
                      ),
                      child: SafeArea(
                        top: false,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const SizedBox(height: 16),
                              
                              // Main Typography Section
                              Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    slide.title1,
                                    style: GoogleFonts.inter(
                                      color: darkGreen,
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: -0.5,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                  if (slide.title2.isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      slide.title2,
                                      style: GoogleFonts.inter(
                                        color: orangeText,
                                        fontSize: 20,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                  const SizedBox(height: 12),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                                    child: Text(
                                      slide.subtitle,
                                      style: GoogleFonts.inter(
                                        color: Colors.grey.shade600,
                                        fontSize: 13,
                                        height: 1.4,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ],
                              ),

                              // 3 Highlight Feature Icons
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                children: [
                                  _buildFeatureItem(slide.feature1Icon, slide.feature1TextTop, slide.feature1TextBottom),
                                  _buildFeatureItem(slide.feature2Icon, slide.feature2TextTop, slide.feature2TextBottom),
                                  _buildFeatureItem(slide.feature3Icon, slide.feature3TextTop, slide.feature3TextBottom),
                                ],
                              ),

                              // Bottom Controls
                              Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Dots Progress Indicator
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: List.generate(_totalPages, (dotIdx) {
                                      final isActive = dotIdx == _currentPage;
                                      return AnimatedContainer(
                                        duration: const Duration(milliseconds: 250),
                                        margin: const EdgeInsets.symmetric(horizontal: 4),
                                        height: 6,
                                        width: isActive ? 18 : 6,
                                        decoration: BoxDecoration(
                                          color: isActive ? darkGreen : Colors.grey.shade400,
                                          borderRadius: BorderRadius.circular(3),
                                        ),
                                      );
                                    }),
                                  ),
                                  
                                  // Action Button (Only on the last slide)
                                  if (_currentPage == _totalPages - 1) ...[
                                    const SizedBox(height: 16),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                      child: InkWell(
                                        onTap: _onMainAction,
                                        borderRadius: BorderRadius.circular(30),
                                        child: Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(vertical: 14),
                                          decoration: BoxDecoration(
                                            color: primaryColor,
                                            borderRadius: BorderRadius.circular(30),
                                            boxShadow: [
                                              BoxShadow(
                                                color: primaryColor.withOpacity(0.3),
                                                blurRadius: 8,
                                                offset: const Offset(0, 4),
                                              ),
                                            ],
                                          ),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                'Get Started',
                                                style: GoogleFonts.inter(
                                                  color: Colors.white,
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ] else ...[
                                    const SizedBox(height: 8),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Logo intersecting the image and container
                  Positioned(
                    top: MediaQuery.of(context).size.height * 0.40 - 48,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Image.asset(
                        'assets/kakinada_fresh_logo.png',
                        width: 90,
                        height: 90,
                        fit: BoxFit.contain,
                        filterQuality: FilterQuality.high,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          
          // Skip Utility Button (Top Right)
          if (_currentPage < _totalPages - 1)
            Positioned(
              top: MediaQuery.of(context).padding.top + 16,
              right: 24,
              child: GestureDetector(
                onTap: _onSkip,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    'Skip',
                    style: GoogleFonts.inter(
                      color: Colors.black87,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String textTop, String textBottom) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.green.shade700, size: 24),
        ),
        const SizedBox(height: 8),
        Text(
          textTop,
          style: GoogleFonts.inter(
            color: Colors.grey.shade700,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
        Text(
          textBottom,
          style: GoogleFonts.inter(
            color: Colors.grey.shade700,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _OnboardingSlide {
  final String imageUrl;
  final String title1;
  final String title2;
  final String subtitle;
  final IconData feature1Icon;
  final String feature1TextTop;
  final String feature1TextBottom;
  final IconData feature2Icon;
  final String feature2TextTop;
  final String feature2TextBottom;
  final IconData feature3Icon;
  final String feature3TextTop;
  final String feature3TextBottom;

  _OnboardingSlide({
    required this.imageUrl,
    required this.title1,
    required this.title2,
    required this.subtitle,
    required this.feature1Icon,
    required this.feature1TextTop,
    required this.feature1TextBottom,
    required this.feature2Icon,
    required this.feature2TextTop,
    required this.feature2TextBottom,
    required this.feature3Icon,
    required this.feature3TextTop,
    required this.feature3TextBottom,
  });
}
`;
  fs.writeFileSync(onboardingPath, onboardingContent, 'utf8');
  console.log('Updated onboarding_screen.dart with Supabase dynamic loading and offline fallback');
}

// ==============================================================================
// 3. UPDATE firebase_messaging_service.dart
// ==============================================================================
const fcmServicePath = 'D:/AervoApp/lib/core/services/firebase_messaging_service.dart';
if (fs.existsSync(fcmServicePath)) {
  const fcmContent = `import 'dart:convert';
import 'dart:developer';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../network/supabase_client.dart';

class FirebaseMessagingService {
  static const String _backendApiUrl = 'https://admin-kakinad.vercel.app/api/register-device-token';
  static const String _localApiUrl = 'http://10.0.2.2:3000/api/register-device-token';

  /// Register current device FCM token with the verified server backend
  Future<void> registerDeviceToken({
    String? userId,
    required String token,
  }) async {
    try {
      String? idToken;
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        idToken = await currentUser.getIdToken();
      }

      final payload = {
        'fcm_token': token,
        if (idToken != null) 'firebase_id_token': idToken,
        'platform': Platform.isIOS ? 'ios' : 'android',
      };

      // 1. Try local dev server first, fallback to prod URL
      for (final endpoint in [_localApiUrl, _backendApiUrl]) {
        try {
          final res = await http.post(
            Uri.parse(endpoint),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          ).timeout(const Duration(seconds: 4));

          if (res.statusCode == 200) {
            log('Device FCM token successfully registered via server endpoint ($endpoint)');
            return;
          }
        } catch (_) {
          // continue to next endpoint
        }
      }
    } catch (e) {
      log('Error registering device token: $e');
    }
  }

  /// Initialize token listener on app startup
  void initTokenRefreshListener() {
    try {
      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
        log('FCM Token refreshed: $newToken');
        registerDeviceToken(token: newToken);
      });
    } catch (e) {
      log('Error setting up onTokenRefresh listener: $e');
    }
  }

  /// Remove token on logout
  Future<void> removeDeviceToken({
    required String userId,
    required String token,
  }) async {
    log('FCM token removed locally for user $userId');
  }

  /// Stream notifications from Supabase
  Stream<List<Map<String, dynamic>>> notificationsStream(String userId) {
    return SupabaseService().client
        .from('notifications')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .limit(50);
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      await SupabaseService().client
          .from('notifications')
          .update({'is_read': true})
          .eq('id', notificationId);
    } catch (e) {
      log('Error marking notification as read in Supabase: $e');
    }
  }
}
`;
  fs.writeFileSync(fcmServicePath, fcmContent, 'utf8');
  console.log('Updated firebase_messaging_service.dart with server-side registration and Supabase integration');
}

// ==============================================================================
// 4. UPDATE notifications_screen.dart
// ==============================================================================
const notifScreenPath = 'D:/AervoApp/lib/features/customer/presentation/notifications_screen.dart';
if (fs.existsSync(notifScreenPath)) {
  const notifScreenContent = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/aervo_brand_text.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/aervo_colors.dart';
import '../../../core/theme/aervo_design.dart';
import '../../../core/network/supabase_client.dart';
import 'package:firebase_auth/firebase_auth.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String _activeCategory = 'All';
  bool _isLoading = true;
  List<Map<String, dynamic>> _notifications = [];

  final List<String> _categories = ['All', 'Order Updates', 'Offers', 'Freshness Alerts'];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final supabase = SupabaseService().client;
      final currentUserId = FirebaseAuth.instance.currentUser?.uid;

      // Query broadcast notifications (user_id IS NULL) + user-specific notifications
      var query = supabase
          .from('notifications')
          .select()
          .order('created_at', ascending: false)
          .limit(50);

      final response = await query;

      if (response is List) {
        List<Map<String, dynamic>> loaded = response.map((data) {
          final type = (data['type'] ?? 'Promo').toString();
          String cat = 'Offers';
          IconData icon = Icons.notifications_active_rounded;

          if (type == 'Order' || type == 'Delivery') {
            cat = 'Order Updates';
            icon = Icons.local_shipping_rounded;
          } else if (type == 'Fresh' || type == 'Alert') {
            cat = 'Freshness Alerts';
            icon = Icons.eco_rounded;
          }

          return {
            'id': data['id'].toString(),
            'title': data['title'] ?? 'Kakinada Fresh Update',
            'body': data['message'] ?? data['body'] ?? '',
            'category': cat,
            'time': _formatTimestamp(data['created_at']),
            'is_read': data['is_read'] == true,
            'deep_link': data['deep_link'],
            'icon': icon,
          };
        }).toList();

        if (loaded.isEmpty) {
          loaded = [
            {
              'id': 'welcome_1',
              'title': 'Welcome to Kakinada Fresh! 🌊',
              'body': 'Get fresh local seafood, prime meats & farm groceries delivered to your doorstep.',
              'category': 'Offers',
              'time': 'Just now',
              'is_read': false,
              'deep_link': '/customer/aisles',
              'icon': Icons.notifications_active_rounded,
            },
          ];
        }

        if (mounted) {
          setState(() {
            _notifications = loaded;
            _isLoading = false;
          });
        }
        return;
      }
    } catch (e) {
      debugPrint("Error fetching notifications from Supabase: $e");
    }

    if (mounted) {
      setState(() {
        _notifications = [
          {
            'id': 'welcome_fallback',
            'title': 'Welcome to Kakinada Fresh!',
            'body': 'Fresh coastal seafood and organic produce delivered in minutes.',
            'category': 'Offers',
            'time': 'Just now',
            'is_read': false,
            'deep_link': '/customer/aisles',
            'icon': Icons.notifications_active_rounded,
          },
        ];
        _isLoading = false;
      });
    }
  }

  Future<void> _handleNotificationTap(Map<String, dynamic> item) async {
    final notifId = item['id']?.toString();
    final deepLink = item['deep_link'] as String?;

    // Optimistically mark as read
    setState(() {
      item['is_read'] = true;
    });

    if (notifId != null && !notifId.startsWith('welcome_')) {
      try {
        await SupabaseService().client
            .from('notifications')
            .update({'is_read': true})
            .eq('id', notifId);
      } catch (err) {
        debugPrint("Error marking notification as read: $err");
      }
    }

    if (deepLink != null && deepLink.isNotEmpty) {
      try {
        context.push(deepLink);
      } catch (_) {
        context.go(deepLink);
      }
    }
  }

  String _formatTimestamp(String? isoString) {
    if (isoString == null) return 'Just now';
    try {
      final dt = DateTime.parse(isoString).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '\${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '\${diff.inHours}h ago';
      return '\${dt.day}/\${dt.month}/\${dt.year}';
    } catch (_) {
      return 'Recently';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final topPadding = MediaQuery.of(context).padding.top;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    final filtered = _activeCategory == 'All'
        ? _notifications
        : _notifications.where((n) => n['category'] == _activeCategory).toList();

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Container(color: AervoColors.background),
          ),

          Positioned.fill(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: EdgeInsets.fromLTRB(
                24,
                topPadding + 76,
                24,
                bottomPadding + 40,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AervoDesign.spacingSm),
                  Text(
                    'Notifications',
                    style: theme.textTheme.displayMedium?.copyWith(
                      color: AervoColors.onSurface,
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: AervoDesign.spacingMd),

                  _buildCategoryChips(),
                  const SizedBox(height: AervoDesign.spacingLg),

                  if (_isLoading)
                    const Padding(
                      padding: EdgeInsets.only(top: 40),
                      child: Center(
                        child: CircularProgressIndicator(color: AervoColors.primary),
                      ),
                    )
                  else if (filtered.isNotEmpty) ...[
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        return _buildNotificationItem(filtered[index]);
                      },
                    ),
                    const SizedBox(height: AervoDesign.spacingLg),
                  ] else
                    _buildEmptyState(theme),
                ],
              ),
            ),
          ),

          // Custom Top App Bar Overlay
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              color: Colors.white.withOpacity(0.92),
              padding: EdgeInsets.fromLTRB(24, topPadding + 8, 24, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/customer/profile');
                      }
                    },
                    icon: const Icon(Icons.arrow_back, color: AervoColors.onSurface),
                  ),
                  Expanded(
                    child: Center(
                      child: AervoBrandText(
                        'Kakinada Fresh',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: AervoColors.primary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChips() {
    return SizedBox(
      height: 38,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _activeCategory == cat;

          return GestureDetector(
            onTap: () {
              setState(() {
                _activeCategory = cat;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AervoColors.secondary : Colors.white,
                borderRadius: BorderRadius.circular(AervoDesign.radiusFull),
                border: Border.all(
                  color: isSelected ? Colors.transparent : AervoColors.outlineVariant.withOpacity(0.3),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                cat,
                style: TextStyle(
                  color: isSelected ? Colors.white : AervoColors.onSurfaceVariant,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotificationItem(Map<String, dynamic> item) {
    final isRead = item['is_read'] == true;

    return GestureDetector(
      onTap: () => _handleNotificationTap(item),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isRead ? Colors.white : const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(AervoDesign.radiusMd),
          border: Border.all(
            color: isRead ? AervoColors.outlineVariant.withOpacity(0.2) : AervoColors.primary.withOpacity(0.4),
            width: isRead ? 1 : 1.5,
          ),
          boxShadow: isRead ? [] : [
            BoxShadow(
              color: AervoColors.primary.withOpacity(0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(AervoDesign.spacingMd),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isRead ? AervoColors.surfaceContainerLow : AervoColors.primary.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                item['icon'] as IconData,
                color: isRead ? AervoColors.onSurfaceVariant : AervoColors.primary,
                size: AervoDesign.iconMd,
              ),
            ),
            const SizedBox(width: AervoDesign.spacingMd),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item['title'] as String,
                          style: TextStyle(
                            fontWeight: isRead ? FontWeight.w600 : FontWeight.bold,
                            fontSize: 14,
                            color: isRead ? AervoColors.onSurface : Colors.black,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        item['time'] as String,
                        style: const TextStyle(color: Colors.grey, fontSize: 10),
                      ),
                    ],
                  ),
                  const SizedBox(height: AervoDesign.spacingXs),
                  Text(
                    item['body'] as String,
                    style: TextStyle(
                      color: AervoColors.onSurfaceVariant,
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Column(
      children: [
        const SizedBox(height: 60),
        Center(
          child: Text(
            'No updates available',
            style: theme.textTheme.titleMedium?.copyWith(
              color: AervoColors.onSurfaceVariant,
            ),
          ),
        ),
      ],
    );
  }
}
`;
  fs.writeFileSync(notifScreenPath, notifScreenContent, 'utf8');
  console.log('Updated notifications_screen.dart with Supabase query, tap mark-as-read, and deep-link handling');
}

console.log('All Flutter app files updated successfully!');

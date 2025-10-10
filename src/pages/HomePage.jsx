import { Link } from 'react-router-dom'
import { TrendingUp, Target, Shield, Zap, Users, BarChart3, ChevronRight, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export default function HomePage() {
  // Fetch stats (if available)
  const { data: stats } = useQuery({
    queryKey: ['homeStats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/markets?status=open')
        return {
          totalMarkets: response.data.count || 0,
          activeTraders: 1250, // Mock data - sonra backend'den gelecek
          totalVolume: '₺125,000' // Mock data
        }
      } catch {
        return { totalMarkets: 0, activeTraders: 0, totalVolume: '₺0' }
      }
    }
  })

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/50"></div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Türkiye'nin İlk Tahmin Pazarı</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Geleceği Tahmin Et,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400">
                Kazanmaya Başla
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-brand-100 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Görüşlerini paylaş, doğru tahminlerle kazan. Blockchain tabanlı, şeffaf ve adil tahmin platformu.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link 
                to="/markets" 
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-600 rounded-xl font-bold text-lg hover:bg-yellow-50 hover:shadow-xl transition-all transform hover:scale-105"
              >
                Pazarları Keşfet
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all"
              >
                Ücretsiz Başla
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">{stats?.totalMarkets || 0}</div>
                <div className="text-sm text-brand-200">Aktif Pazar</div>
              </div>
              <div className="text-center border-x border-white/20">
                <div className="text-3xl md:text-4xl font-bold mb-1">{stats?.activeTraders || 0}</div>
                <div className="text-sm text-brand-200">Katılımcı</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">{stats?.totalVolume || '₺0'}</div>
                <div className="text-sm text-brand-200">İşlem Hacmi</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 md:h-24 text-gray-50" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 24.3125L60 32.1094C120 39.9062 240 55.5 360 63.2969C480 71.0938 600 71.0938 720 63.2969C840 55.5 960 39.9062 1080 32.1094C1200 24.3125 1320 24.3125 1380 24.3125H1440V74H1380C1320 74 1200 74 1080 74C960 74 840 74 720 74C600 74 480 74 360 74C240 74 120 74 60 74H0V24.3125Z" fill="currentColor"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Neden Kahin Market?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modern teknoloji ile güvenli, şeffaf ve adil bir tahmin deneyimi
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: TrendingUp,
              title: 'Gerçek Zamanlı',
              description: 'Anlık fiyat güncellemeleri ve order book ile pazarın nabzını tut',
              color: 'from-blue-500 to-cyan-500',
              iconBg: 'bg-blue-100',
              iconColor: 'text-blue-600'
            },
            {
              icon: Target,
              title: 'Detaylı Analiz',
              description: 'Portfolio takibi, performans metrikleri ve kar/zarar raporları',
              color: 'from-purple-500 to-pink-500',
              iconBg: 'bg-purple-100',
              iconColor: 'text-purple-600'
            },
            {
              icon: Shield,
              title: 'Güvenli',
              description: 'Şifreli veri, güvenli işlemler ve kullanıcı dostu arayüz',
              color: 'from-green-500 to-emerald-500',
              iconBg: 'bg-green-100',
              iconColor: 'text-green-600'
            },
            {
              icon: Zap,
              title: 'Hızlı',
              description: 'Anında emir eşleştirme ve düşük latency ile kesintisiz işlem',
              color: 'from-orange-500 to-red-500',
              iconBg: 'bg-orange-100',
              iconColor: 'text-orange-600'
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              <div className="relative">
                <div className={`inline-flex p-4 ${feature.iconBg} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-xl text-gray-600">
              3 basit adımda tahmin yapmaya başla
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Hesap Oluştur',
                description: 'Ücretsiz kayıt ol ve hesabına para yükle. İlk üyelere hoş geldin bonusu!',
                icon: Users
              },
              {
                step: '02',
                title: 'Pazar Seç',
                description: 'İlgi alanına göre spor, politika, ekonomi veya eğlence kategorilerinden seç.',
                icon: BarChart3
              },
              {
                step: '03',
                title: 'Tahmin Yap',
                description: 'EVET veya HAYIR hissesi satın al. Doğru tahmin edersen kazanırsın!',
                icon: TrendingUp
              }
            ].map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 text-white rounded-full text-2xl font-bold mb-6">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <step.icon className="w-12 h-12 text-brand-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>

                {/* Arrow (except last) */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <ChevronRight className="w-8 h-8 text-gray-300 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl p-12 md:p-20 text-center text-white">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Hazır mısın?
            </h2>
            <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
              Hemen kayıt ol, ilk pazarında tahminini paylaş ve kazanmaya başla!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-600 rounded-xl font-bold text-lg hover:bg-yellow-50 hover:shadow-xl transition-all transform hover:scale-105"
              >
                Ücretsiz Kayıt Ol
                <Sparkles className="w-5 h-5" />
              </Link>
              <Link 
                to="/markets" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                Pazarlara Göz At
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
import { Link } from 'react-router-dom'
import { TrendingUp, Target, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Geleceği Tahmin Et,<br />
          <span className="text-brand-600">Kazan</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Türkiye'nin ilk tahmin pazarı platformu
        </p>
        <Link to="/markets" className="btn btn-primary text-lg px-8 py-3">
          Pazarları Keşfet
        </Link>
      </section>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FadeIn } from '@/components/ui'
import { Star } from '@/components/Icons'

interface Review {
  name: string
  role: string
  content: string
  rating: number
}

const fallback: Review[] = [
  {
    name: 'Jean-Pierre M.',
    role: 'Président club, Marseille',
    content: 'Fini les tableaux Excel. Cette app a transformé nos tournois du dimanche.',
    rating: 5,
  },
  {
    name: 'Marie L.',
    role: 'Organisatrice, Lyon',
    content: 'Simple, rapide, les joueurs adorent suivre leur classement en direct.',
    rating: 5,
  },
  {
    name: 'Patrick D.',
    role: 'Arbitre fédéral',
    content: 'Une solution qui respecte vraiment les règles officielles. Enfin.',
    rating: 5,
  },
]

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>(fallback)
  const [stats, setStats] = useState({ average: 0, total: 0 })

  useEffect(() => {
    fetch('/api/reviews?approved=true&limit=3&order_by=rating')
      .then((r) => r.json())
      .then((data) => {
        if (data?.reviews && Array.isArray(data.reviews) && data.reviews.length >= 3) {
          setReviews(
            data.reviews.map((r: any) => ({
              name: r.author_name || 'Utilisateur',
              role: r.author_role || 'Bouleur',
              content: r.content || '',
              rating: r.rating || 5,
            }))
          )
        }
        if (data?.stats) {
          setStats({ average: data.stats.average || 0, total: data.stats.total || 0 })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="max-w-2xl mb-14">
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
            Ce qu'en disent les bouleurs
          </p>
          <div className="flex items-end gap-4 flex-wrap">
            <h2 className="text-3xl md:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.1]">
              Ils tirent juste<br />
              <span className="accent-italic text-petanque-vert">depuis Pétanque Pro.</span>
            </h2>
            {stats.total > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(stats.average) ? 'text-petanque-cochonnet' : 'text-petanque-sable-bord'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-sm text-petanque-bois">
                  {stats.average.toFixed(1)}/5 · {stats.total} avis
                </span>
              </div>
            )}
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {reviews.slice(0, 3).map((review, i) => (
            <FadeIn key={i} delay={i * 120}>
              <figure className="h-full flex flex-col bg-petanque-sable-pale border border-petanque-sable-bord/40 rounded-xl p-6">
                <div className="flex mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-petanque-cochonnet" />
                  ))}
                </div>
                <blockquote className="text-base text-petanque-vert-fonce leading-relaxed mb-5 flex-1">
                  « {review.content} »
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-petanque-vert text-petanque-sable flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-petanque-vert-fonce">{review.name}</p>
                    <p className="text-xs text-petanque-bois">{review.role}</p>
                  </div>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>

        {stats.total > 3 && (
          <FadeIn>
            <Link
              href="/avis"
              className="inline-flex items-center gap-2 text-sm font-medium text-petanque-vert hover:text-petanque-vert-fonce group"
            >
              Voir tous les {stats.total} avis
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </FadeIn>
        )}
      </div>
    </section>
  )
}

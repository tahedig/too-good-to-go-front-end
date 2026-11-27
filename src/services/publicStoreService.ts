import { apiRequest } from '@/lib/api/client'
import { catalogueService } from '@/services/catalogueService'
import type { DiscoveryLocation } from '@/types/discoveryTypes'
import type { PublicStore, PublicStoreResponseDto } from '@/types/publicStoreTypes'

export const publicStoreService = {
  async get(id: string, location?: DiscoveryLocation): Promise<PublicStore> {
    const [dto, offers] = await Promise.all([
      apiRequest<PublicStoreResponseDto>(`/stores/${encodeURIComponent(id)}`),
      catalogueService.getStoreOffers(id, location),
    ])
    const products = offers.map((offer) => ({
      id: offer.id,
      name: offer.description,
      category: offer.category,
      distanceKm: offer.distanceKm,
      description: offer.description,
      price: offer.price,
      referenceValue: offer.referenceValue,
      quantityAvailable: offer.quantityAvailable,
      availabilityBadge: offer.availabilityBadge,
      pickup: offer.pickup,
      imageSrc: offer.imageSrc,
      isFavorite: offer.isFavorite,
    }))

    return {
      id: dto.id,
      name: dto.name,
      category: dto.category_name,
      headerSubtitle: dto.header_subtitle,
      neighborhood: dto.district || dto.city || '',
      description: dto.biography,
      availability: !dto.is_open ? 'closed' : products.length > 0 ? 'available' : 'empty',
      statusLabel: dto.status_badge,
      heroImageSrc: dto.cover_image_url,
      address: dto.pickup_address,
      location: dto.location,
      openingHours: dto.working_hours_schedule.map(({ days, hours }) => ({ days, hours })),
      pickupGuide: dto.pickup_instructions,
      pickupSummary: dto.pickup_summary,
      products,
    }
  },
}

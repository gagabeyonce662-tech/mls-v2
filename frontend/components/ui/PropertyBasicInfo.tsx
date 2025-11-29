"use client";

interface PropertyBasicInfoProps {
  address: string;
  neighborhood: string;
  city: string;
  province: string;
  estimatedValue?: string;
  estimatedRent?: string;
}

export function PropertyBasicInfo({
  address,
  neighborhood,
  city,
  province,
  estimatedValue,
  estimatedRent,
}: PropertyBasicInfoProps) {
  return (
    <div className="py-6 border-b border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{address}</h1>
          <p className="text-lg text-gray-600 mt-1">
            {neighborhood} - {city}
          </p>
          <p className="text-gray-500">{city}, {province}</p>
        </div>
        <div className="flex flex-col md:items-end gap-2">
          {estimatedValue && (
            <div>
              <span className="text-sm text-gray-600">Estimated Value: </span>
              <span className="text-xl font-semibold text-gray-900">{estimatedValue}</span>
            </div>
          )}
          {estimatedRent && (
            <div>
              <span className="text-sm text-gray-600">Estimated Rent: </span>
              <span className="text-xl font-semibold text-gray-900">{estimatedRent}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


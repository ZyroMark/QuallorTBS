"use client";

import { useAuth } from "@/app/context/AuthContext";
import { DEFAULT_PROVINCE, PROVINCE_BY_ID, type Province, type ProvinceId } from "@/lib/places";

/**
 * The network the signed-in passenger travels in.
 *
 * Stored on the profile rather than in component state, so the choice follows
 * the account across devices and survives a reload. Falls back to the Eastern
 * Cape while the session is still loading, which is also the column default.
 */
export function useProvince(): {
    provinceId: ProvinceId;
    province: Province;
    setProvince: (next: ProvinceId) => Promise<boolean>;
    isReady: boolean;
} {
    const { user, updateUser, isLoading } = useAuth();
    const provinceId = user?.homeProvince ?? DEFAULT_PROVINCE;

    async function setProvince(next: ProvinceId): Promise<boolean> {
        if (!user || next === provinceId) return false;
        const result = await updateUser({ homeProvince: next });
        return result.success;
    }

    return {
        provinceId,
        province: PROVINCE_BY_ID[provinceId],
        setProvince,
        isReady: !isLoading && Boolean(user),
    };
}

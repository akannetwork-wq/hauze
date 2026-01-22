import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        ppr: 'incremental',
        serverActions: {
            bodySizeLimit: '5mb',
        },
    },
};

export default nextConfig;

// src/AssetsPage.tsx
import {useEffect, useState} from "react";
import {fetchAssets, type Asset} from "./api/assets";

export function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchAssets();
                setAssets(data);
            } catch (err: any) {
                setError(err.message ?? "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    if (loading) return <div>Loading assets…</div>;
    if (error) return <div style={{color: "red"}}>Error: {error}</div>;

    return (
        <div style={{padding: "1.5rem"}}>
            <p>Showing {assets.length} assets from framework.ephany.io</p>
            <div style={{overflowX: "auto", width: "100%"}}>
                <table style={{borderCollapse: "collapse", width: "100%"}}>
                    <thead>
                    <tr>
                        <th style={{borderBottom: "1px solid #ccc"}}>Type ID</th>
                        <th style={{borderBottom: "1px solid #ccc"}}>Name</th>
                        <th style={{borderBottom: "1px solid #ccc"}}>Manufacturer</th>
                        <th style={{borderBottom: "1px solid #ccc"}}>Model</th>
                        <th style={{borderBottom: "1px solid #ccc"}}>Door Type</th>
                    </tr>
                    </thead>
                    <tbody>
                    {assets.map((asset) => {
                        let doorTypeDisplay: string;

                        if (!asset.custom_fields) {
                            // The asset has no custom_fields object at all
                            doorTypeDisplay = "no custom fields";
                        } else if (
                            !Object.prototype.hasOwnProperty.call(asset.custom_fields, "door_type")
                        ) {
                            // The asset has custom_fields but this specific field is missing
                            doorTypeDisplay = "CUSTOM FIELD NOT FOUND";
                        } else {
                            // The field exists (may still be null or empty)
                            const value = (asset.custom_fields as any).door_type;
                            doorTypeDisplay = value ?? "–";
                        }

                        return (
                            <tr key={asset.id}>
                                <td style={{padding: "0.3rem 0.5rem"}}>{asset.type_id}</td>
                                <td style={{padding: "0.3rem 0.5rem"}}>{asset.name}</td>
                                <td style={{padding: "0.3rem 0.5rem"}}>{asset.manufacturer_name}</td>
                                <td style={{padding: "0.3rem 0.5rem"}}>{asset.model}</td>
                                <td style={{padding: "0.3rem 0.5rem"}}>{doorTypeDisplay}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

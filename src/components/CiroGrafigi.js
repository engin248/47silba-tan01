import React from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const secenekler = {
    responsive: true,
    plugins: {
        legend: { position: 'top', labels: { color: '#94a3b8' } },
        title: { display: true, text: 'Aylık Ciro & Maliyet Verim Analizi', color: '#f8fafc' },
    },
    scales: {
        y: { ticks: { color: '#64748b' }, grid: { color: '#334155' } },
        x: { ticks: { color: '#64748b' }, grid: { color: '#334155' } }
    }
};

const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz'];

export const data = {
    labels: aylar,
    datasets: [
        {
            label: 'Tahsil Edilen Ciro (₺)',
            data: [350000, 420000, 380000, 510000, 600000, 580000, 720000],
            borderColor: '#10b981', // Zümrüt Yeşili
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            tension: 0.3
        },
        {
            label: 'Üretim & Personel Maliyeti (₺)',
            data: [150000, 180000, 160000, 200000, 230000, 210000, 250000],
            borderColor: '#ef4444', // Kırmızı
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            tension: 0.3
        },
    ],
};

export function CiroGrafigi() {
    return (
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
            <Line options={secenekler} data={data} />
        </div>
    );
}

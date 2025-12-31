export const products = [
    // New Arrivals
    {
        id: '1',
        name: 'Classic Oxford White',
        price: '$89.00',
        category: 'Formal',
        image: '/white-shirt.png',
        section: 'New Arrivals'
    },
    {
        id: '2',
        name: 'Midnight Blue Silk',
        price: '$120.00',
        category: 'After Hours',
        image: '/midnight-blue-shirt.png',
        section: 'New Arrivals'
    },
    {
        id: '3',
        name: 'Slate Grey Linen',
        price: '$75.00',
        category: 'Casual',
        image: '/grey-linen-shirt.png',
        section: 'New Arrivals'
    },
    {
        id: '4',
        name: 'Pinstripe Executive',
        price: '$95.00',
        category: 'Business',
        image: '/white-shirt.png', // Fallback
        section: 'New Arrivals'
    },
    // Best Sellers
    {
        id: '5',
        name: 'The Perfect White Tee',
        price: '$45.00',
        category: 'Essentials',
        image: '/white-shirt.png', // Fallback
        section: 'Best Sellers'
    },
    {
        id: '6',
        name: 'Charcoal Slim Fit',
        price: '$92.00',
        category: 'Business',
        image: '/charcoal-slim-fit.png',
        section: 'Best Sellers'
    },
    {
        id: '7',
        name: 'Monaco Blue Linen',
        price: '$78.00',
        category: 'Casual',
        image: '/monaco-blue-linen.png',
        section: 'Best Sellers'
    },
    {
        id: '8',
        name: 'Signature Black Silk',
        price: '$135.00',
        category: 'Formal',
        image: '/black-silk-shirt.png',
        section: 'Best Sellers'
    },
];

export const newArrivals = products.filter(p => p.section === 'New Arrivals');
export const bestSellers = products.filter(p => p.section === 'Best Sellers');

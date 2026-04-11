import { render, screen } from '@testing-library/react';
import TransportProviderCard from '../TransportProviderCard';

const mockProviderWithContinents = {
  id: '1',
  name: 'Test Transport Provider',
  email: 'test@example.com',
  phoneNumber: '+1 234 567 890',
  avatarUrl: 'https://example.com/avatar.jpg',
  status: 'Active' as const,
  vehicleCount: 5,
  continents: ['Asia', 'Europe'],
  address: '123 Main St',
  bookingCount: 10,
};

const mockProviderWithoutContinents = {
  ...mockProviderWithContines，
  continents: [],
};

describe('TransportProviderCard - Continent Badges', () => {
  it('renders continent badges when continents array is non-empty', () => {
    render(<TransportProviderCard provider={mockProviderWithContinents} />);

    expect(screen.getByText('Asia')).toBeInTheDocument();
    expect(screen.getByText('Europe')).toBeInTheDocument();
  });

  it('does not render any continent badges when continents array is empty', () => {
    render(<TransportProviderCard provider={mockProviderWithoutContinents} />);

    expect(screen.queryByText('Asia')).not.toBeInTheDocument();
    expect(screen.queryByText('Europe')).not.toBeInTheDocument();
  });

  it('renders a single continent badge correctly', () => {
    const single = { ...mockProviderWithContinents, continents: ['Africa'] };
    render(<TransportProviderCard provider={single} />);
    expect(screen.getByText('Africa')).toBeInTheDocument();
  });
});

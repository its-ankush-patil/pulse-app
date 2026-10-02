import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('customer user journeys', () => {
  it('shows the login screen in demo mode and allows a guest to continue', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /pulse/i })).toBeInTheDocument();
    expect(screen.getByText(/firebase is not configured\. running in demo mode\./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /or continue as guest/i }));

    expect(await screen.findByRole('button', { name: /tap to count/i })).toBeInTheDocument();
  });

  it('lets a user tap the counter and adjust the daily goal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /or continue as guest/i }));

    const tapButton = await screen.findByRole('button', { name: /tap to count/i });
    const goalInput = screen.getByDisplayValue('108');

    fireEvent.change(goalInput, { target: { value: '3' } });
    fireEvent.blur(goalInput);

    await user.click(tapButton);
    await user.click(tapButton);
    await user.click(tapButton);

    const orbCount = document.querySelector('.orb-count');
    expect(orbCount).toHaveTextContent('3');
  });
});

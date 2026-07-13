import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal.jsx';

describe('Modal', () => {
  test('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden">
        <p>body</p>
      </Modal>
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  test('renders the title and children when open', () => {
    render(
      <Modal isOpen onClose={() => {}} title="My Modal">
        <p>modal body</p>
      </Modal>
    );
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('modal body')).toBeInTheDocument();
  });

  test('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="X">
        <p>b</p>
      </Modal>
    );
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="X">
        <p>b</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('exposes a labelled dialog role and an accessible close button', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Accessible Modal">
        <p>b</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // The dialog is labelled by its title.
    expect(dialog).toHaveAccessibleName('Accessible Modal');
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  test('moves focus into the dialog when opened', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Focus">
        <button>Inside</button>
      </Modal>
    );
    // Focus lands on the first focusable element within the dialog.
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  test('restores focus to the trigger when closed', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const { rerender } = render(
      <Modal isOpen onClose={() => {}} title="Restore">
        <button>Inside</button>
      </Modal>
    );
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Restore">
        <button>Inside</button>
      </Modal>
    );
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});

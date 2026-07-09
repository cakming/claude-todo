import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EpicForm from './EpicForm.jsx';

describe('EpicForm', () => {
  test('creates a new epic: typed values are passed to onSubmit', () => {
    const onSubmit = vi.fn();
    render(<EpicForm onSubmit={onSubmit} onCancel={() => {}} />);

    // "Create Epic" label when there is no existing epic.
    const submit = screen.getByRole('button', { name: 'Create Epic' });

    fireEvent.change(screen.getByPlaceholderText('E-Commerce Platform v2'), {
      target: { value: 'New Epic' }
    });
    fireEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'New Epic', status: 'planning' });
  });

  test('prefills fields and shows "Update Epic" when editing', () => {
    render(
      <EpicForm
        epic={{ title: 'Existing', desc: 'd', status: 'done' }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Update Epic' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('E-Commerce Platform v2')).toHaveValue('Existing');
  });

  test('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<EpicForm onSubmit={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

jest.mock('@/data/defaults/ModelDefaults', () => ({
  defaults: {
    TestModel: {
      status: 'draft',
      enabled: true,
    },
  },
}));

const { createWithDefaults } = require('@/helpers/CreateWithDefaults') as {
  createWithDefaults: <T>(model: { name: string; create: (data: T) => T }, data: Partial<T>) => T;
};

describe('createWithDefaults', () => {
  const TestModel = {
    name: 'TestModel',
    create: jest.fn(<T>(data: T) => data),
  };

  beforeEach(() => {
    TestModel.create.mockClear();
  });

  it('applies configured defaults before creating the entity', () => {
    const entity = createWithDefaults(TestModel, {
      title: 'Example',
    });

    expect(TestModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Example',
        status: 'draft',
        enabled: true,
      }),
    );
    expect(entity).toEqual(
      expect.objectContaining({
        title: 'Example',
        status: 'draft',
        enabled: true,
      }),
    );
  });

  it('preserves explicit values over configured defaults', () => {
    const entity = createWithDefaults(TestModel, {
      title: 'Example',
      status: 'published',
      enabled: false,
    });

    expect(entity).toEqual(
      expect.objectContaining({
        title: 'Example',
        status: 'published',
        enabled: false,
      }),
    );
  });

  it('generates an id when one is not provided', () => {
    const entity = createWithDefaults(TestModel, {
      title: 'Generated',
    }) as { id?: string; title: string };

    expect(entity.title).toBe('Generated');
    expect(entity.id).toEqual(expect.any(String));
    expect(entity.id).toHaveLength(8);
  });

  it('keeps a provided id unchanged', () => {
    const entity = createWithDefaults(TestModel, {
      id: 'existing-id',
      title: 'Existing',
    }) as { id: string; title: string };

    expect(entity.id).toBe('existing-id');
  });
});

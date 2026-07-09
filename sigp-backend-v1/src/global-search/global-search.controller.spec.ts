import { GlobalSearchController } from './global-search.controller';
import { GlobalSearchService } from './global-search.service';
import { GlobalSearchQueryDto, SearchModuleFilter } from './dto/global-search-query.dto';
import { GlobalSearchResponseDto } from './dto/global-search-response.dto';

function buildResponse(): GlobalSearchResponseDto {
  return {
    items: [
      {
        id: 'proj-1',
        module: 'projects',
        title: 'Projet santé',
        subtitle: 'PRJ-001',
        status: 'EN_COURS',
        url: '/api/v1/projects/proj-1',
        projectId: 'proj-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    ],
    total: 1,
    query: 'santé',
  };
}

function buildMocks() {
  const globalSearchService = {
    search: jest.fn().mockResolvedValue(buildResponse()),
  } as unknown as jest.Mocked<GlobalSearchService>;

  const controller = new GlobalSearchController(globalSearchService);
  return { controller, globalSearchService };
}

describe('GlobalSearchController', () => {
  it('search() delegates to service with the query DTO', async () => {
    const { controller, globalSearchService } = buildMocks();
    const queryDto = Object.assign(new GlobalSearchQueryDto(), { query: 'santé' });

    await controller.search(queryDto);

    expect(globalSearchService.search).toHaveBeenCalledWith(queryDto);
  });

  it('returns the full search response from service', async () => {
    const { controller } = buildMocks();
    const queryDto = Object.assign(new GlobalSearchQueryDto(), { query: 'santé' });

    const result = await controller.search(queryDto);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.query).toBe('santé');
    expect(result.items[0].module).toBe('projects');
  });

  it('passes module filter through to the service', async () => {
    const { controller, globalSearchService } = buildMocks();
    const queryDto = Object.assign(new GlobalSearchQueryDto(), {
      query: 'test',
      module: SearchModuleFilter.RISQUES,
    });

    await controller.search(queryDto);

    expect(globalSearchService.search).toHaveBeenCalledWith(
      expect.objectContaining({ module: SearchModuleFilter.RISQUES }),
    );
  });

  it('propagates service errors', async () => {
    const { controller, globalSearchService } = buildMocks();
    globalSearchService.search.mockRejectedValueOnce(new Error('Service error'));
    const queryDto = Object.assign(new GlobalSearchQueryDto(), { query: 'test' });

    await expect(controller.search(queryDto)).rejects.toThrow('Service error');
  });
});

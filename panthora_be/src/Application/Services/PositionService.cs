using Contracts;
using Contracts.Interfaces;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Application.Contracts.Position;
using Domain.Constant;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Services;

public interface IPositionService
{
    Task<ErrorOr<PaginatedListWithPermissions<PositionVm>>> GetAllAsync(GetAllPositionRequest request);
    Task<ErrorOr<Success>> CreateAsync(CreatePositionRequest request);
    Task<ErrorOr<Success>> UpdateAsync(UpdatePositionRequest request);
    Task<ErrorOr<Success>> DeleteAsync(Guid id);
    Task<ErrorOr<List<LookupVm>>> GetComboboxAsync();
}

public class PositionService(IPositionRepository positionRepository, IRoleService roleService, IUser user, IUnitOfWork unitOfWork)
    : IPositionService
{
    private readonly IPositionRepository _positionRepository = positionRepository;
    private readonly IRoleService _roleService = roleService;
    private readonly IUser _user = user;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    public async Task<ErrorOr<Success>> CreateAsync(CreatePositionRequest request)
    {
        var position = PositionEntity.Create(request.Name, request.Level, _user.Id ?? string.Empty, request.Note, request.Type);

        var result = await _positionRepository.Upsert(position);
        if (result.IsError) return result.Errors;

        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> DeleteAsync(Guid id)
    {
        var positionResult = await _positionRepository.FindById(id);
        if (positionResult.IsError) return positionResult.Errors;
        if (positionResult.Value is null)
            return Error.NotFound(ErrorConstants.Position.NotFoundCode, ErrorConstants.Position.NotFoundDescription);

        var position = positionResult.Value;
        position.SoftDelete(_user.Id ?? string.Empty);

        var result = await _positionRepository.Upsert(position);
        if (result.IsError) return result.Errors;

        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<PaginatedListWithPermissions<PositionVm>>> GetAllAsync(GetAllPositionRequest request)
    {
        var positionsResult = await _positionRepository.FindAll();
        if (positionsResult.IsError) return positionsResult.Errors;

        var positions = positionsResult.Value.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            var search = request.SearchText.ToLower();
            positions = positions.Where(p => p.Name.ToLower().Contains(search));
        }

        var total = positions.Count();
        var paged = positions
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new PositionVm(p.Id, p.Name, p.Level, p.Note, p.Type))
            .ToList();

        return new PaginatedListWithPermissions<PositionVm>(total, paged, new Dictionary<string, bool>());
    }

    public async Task<ErrorOr<List<LookupVm>>> GetComboboxAsync()
    {
        var positionsResult = await _positionRepository.FindAll();
        if (positionsResult.IsError) return positionsResult.Errors;

        return positionsResult.Value
            .Select(p => new LookupVm(p.Id.ToString(), p.Name))
            .ToList();
    }

    public async Task<ErrorOr<Success>> UpdateAsync(UpdatePositionRequest request)
    {
        var positionResult = await _positionRepository.FindById(request.Id);
        if (positionResult.IsError) return positionResult.Errors;
        if (positionResult.Value is null)
            return Error.NotFound(ErrorConstants.Position.NotFoundCode, ErrorConstants.Position.NotFoundDescription);

        var position = positionResult.Value;
        position.Update(request.Name, request.Level, _user.Id ?? string.Empty, request.Note, request.Type);

        var result = await _positionRepository.Upsert(position);
        if (result.IsError) return result.Errors;

        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }
}

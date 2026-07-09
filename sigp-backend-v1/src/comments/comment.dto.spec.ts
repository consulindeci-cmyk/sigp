import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

// ─── CreateCommentDto ────────────────────────────────────────────────────────

describe('CreateCommentDto validation', () => {
  const valid = {
    message: 'Un commentaire important',
    module: 'Projet',
    statut: 'OUVERT',
    priorite: 'NORMALE',
  };

  it('accepts a minimal payload (message only)', async () => {
    expect(await errorsFor(CreateCommentDto, { message: 'OK' })).toEqual([]);
  });

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateCommentDto, valid)).toEqual([]);
  });

  it('rejects a missing message', async () => {
    expect(await errorsFor(CreateCommentDto, { ...valid, message: '' })).toContain('message');
  });

  it('rejects an invalid parent_id (not UUID)', async () => {
    expect(await errorsFor(CreateCommentDto, { ...valid, parent_id: 'not-a-uuid' })).toContain(
      'parent_id',
    );
  });

  it('accepts a valid parent_id UUID', async () => {
    expect(
      await errorsFor(CreateCommentDto, {
        ...valid,
        parent_id: 'a1b2c3d4-0000-4000-8000-ef1234567890',
      }),
    ).toEqual([]);
  });

  it('trims and accepts message with leading spaces', () => {
    const instance = plainToInstance(CreateCommentDto, { ...valid, message: '  Bonjour  ' });
    expect(instance.message).toBe('Bonjour');
  });

  it('rejects a non-boolean lu', async () => {
    expect(await errorsFor(CreateCommentDto, { ...valid, lu: 'yes' })).toContain('lu');
  });
});

// ─── UpdateCommentDto ────────────────────────────────────────────────────────

describe('UpdateCommentDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateCommentDto, {})).toEqual([]);
  });

  it('accepts lu=false and statut', async () => {
    expect(await errorsFor(UpdateCommentDto, { lu: false, statut: 'RESOLU' })).toEqual([]);
  });

  it('rejects an empty message string', async () => {
    expect(await errorsFor(UpdateCommentDto, { message: '' })).toContain('message');
  });

  it('rejects a non-boolean lu', async () => {
    expect(await errorsFor(UpdateCommentDto, { lu: 'oui' })).toContain('lu');
  });

  it('does not declare project_id or user_id as mutable', () => {
    const declared = Object.keys(new UpdateCommentDto() as Record<string, unknown>);
    expect(declared).not.toContain('project_id');
    expect(declared).not.toContain('user_id');
  });
});

// ─── CommentQueryDto ──────────────────────────────────────────────────────────

describe('CommentQueryDto validation', () => {
  it('transforms lu="true" into boolean', () => {
    const instance = plainToInstance(CommentQueryDto, { lu: 'true' });
    expect(instance.lu).toBe(true);
  });

  it('leaves lu undefined when absent', async () => {
    const instance = plainToInstance(CommentQueryDto, { page: 1 });
    expect(instance.lu).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('accepts statut, priorite and module filters', async () => {
    expect(
      await errorsFor(CommentQueryDto, { statut: 'OUVERT', priorite: 'HAUTE', module: 'Budget' }),
    ).toEqual([]);
  });
});

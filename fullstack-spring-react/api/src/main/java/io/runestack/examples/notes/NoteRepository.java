package io.runestack.examples.notes;

import java.util.List;

import org.springframework.data.repository.ListCrudRepository;

public interface NoteRepository extends ListCrudRepository<Note, Long> {

    List<Note> findAllByOrderByCreatedAtDesc();
}

SHIFT = 16
CARD_NUM = 54
suits = "s,h,d,c".split(",")
nums = "1,2,3,4,5,6,7,8,9,10,j,q,k".split(",")
multi_select = false
selected = []
zIndex = 10
socket = io.connect(window.location.href)
shuffled = {}

$(document).ready ->

  char = (s) -> s.charCodeAt 0
  send = ->
    msg = {}

    $.each(selected, ->
      msg[ $(this).data("id") ] = {
        offset: $(this).offset(),
        z_index: $(this).css("z-index"),
        face: $(this).face(),
      }
    )
    socket.emit('message',msg)

  shuffle = ->
    shuffled = {}
    i = selected.length
    while i -= 1
      j = Math.floor(Math.random()*(i+1))
      if i == j
        continue
      s1 = selected[i].suit()
      n1 = selected[i].number()
      s2 = selected[j].suit()
      n2 = selected[j].number()
      selected[j].data("suit", s1)
      selected[j].data("num", n1)
      selected[i].data("suit", s2)
      selected[i].data("num", n2)
      selected[i].redraw()
      selected[j].redraw()

      shuffled[selected[i].data("id")]={ visual:"#{s2}-#{n2}"}
      shuffled[selected[j].data("id")]={ visual:"#{s1}-#{n1}"}

    socket.emit("shuffle", shuffled);

  gather = ->
    i=0
    $.each(selected, ->
      $(this).css("top", selected[0].offset().top-i*0.3+"px")
      $(this).css("left", selected[0].offset().left-i*0.3+"px")

      i+=1
    )
  arrange = ->
    i=0
    $.each(selected, ->
      $(this).css("top", selected[0].offset().top+"px")
      $(this).css("left", selected[0].offset().left + 30 * i + "px")

      i+=1
    )
  divide = ->
    playerNum = parseInt(window.prompt("何人に配りますか？",""))
    i=0
    $.each(selected, ->
      $(this).css("top", selected[0].offset().top - i * 0.3 / playerNum + "px")
      $(this).css("left", selected[0].offset().left - i * 0.3 / playerNum + 100 * (i%playerNum) + "px")

      i+=1
    )

  i = 0
  while i < 4
    j = 0
    while j < 13
      $("#back").append "<li id='#{suits[i]}-#{nums[i]}' class='card' data-id='#{suits[i]}-#{nums[j]}' data-suit='#{suits[i]}' data-num='#{nums[j]}' data-face='0' ></li>"
      j++
    i++

  $("#back").append "<li class='card' id='j-1' data-id='j-1' data-suit='j' data-num='1' data-face='0' ></li>"
  $("#back").append "<li class='card' id='j-2' data-id='j-2' data-suit='j' data-num='2' data-face='0' ></li>"

  jQuery.fn.extend({
    number: -> $(this).data "num"
    suit: -> $(this).data "suit"
    face: -> $(this).data "face"
    name: -> $(this).data("suit") + "-" + $(this).data("num")
    img: ->
      if $(this).data("face") isnt 0
        $(this).data("suit") + "-" + $(this).data("num")
      else
        "ura"
    redraw: ->
      $(this).attr("id",$(this).name())
      if $(this).face() == 0
        $(this).addClass("ura")
      else
        $(this).removeClass("ura")
      #$(this).css "background-image", "url('./images/" + $(this).img() + ".gif')"
    flip: ->
      $(this).data "face", 1 - $(this).data("face")
      $(this).redraw()
    open: ->
      $(this).data "face", 1
      $(this).redraw()
    close: ->
      $(this).data "face", 0
      $(this).redraw()
  });

  $("#back").selectable(
    selected: (e, ui) ->
      $(ui.selected).addClass("selected_card").redraw()
      selected.push($(ui.selected))
      zIndex += CARD_NUM
      $(ui.selected).css("z-index", zIndex)
      true
    start: (e, ui) ->
      $(".selected_card").removeClass "selected_card"
      selected = [];
      true
  )

  startPoints=[]

  $(".card").draggable(
    start: (e, ui) ->
      startPoints=[]
      $.each(selected, ->
        str = $(this).name()

        startPoints[str] = $(this).offset()
        #console.log $(this).offset()
      )
    drag: (e, ui) ->
      topDistance = $(this).offset().top - startPoints[$(this).name()].top
      leftDistance = $(this).offset().left - startPoints[$(this).name()].left

      #console.log topDistance
      $.each(selected, ->
        $(this).css("top", (startPoints[$(this).name()].top+topDistance)+"px")
        $(this).css("left", (startPoints[$(this).name()].left+leftDistance)+"px")
      )

      send()

    stop: (e, ui) ->
      send()

  ).each(->
    #card_data[$(this).name()] = [$(this).offset(), $(this).css("z-index")]
    zIndex += 1;
    $(this).css("z-index",zIndex)
    $(this).redraw()
    $(this).attr "id", $(this).name()
    selected.push($(this))

  ).mousedown(->

    console.log "down:" + $(this).name()
    if multi_select
      selected.push $(this)
    else if selected.length == 0 or !$(this).hasClass("selected_card")
      $(".selected_card").removeClass("selected_card")
      selected = [ $(this) ]

    $(this).addClass "selected_card"
    zIndex += CARD_NUM
    $(this).css("z-index", zIndex)
    false

  ).mouseup( ->
    #console.log "up:" + $(this).name()
  )


  $("body").keypress((e) ->
    if e.which == char("f")
      $.each selected, -> $(this).flip()
      send()
    else if e.which == char("d")
      $.each selected, -> $(this).open()
      send()
    else if e.which == char("s")
      $.each selected, -> $(this).close()
      send()
    else if e.which == char("a")
      shuffle()
    else if e.which == char("g")
      gather()
      send()
    else if e.which == char("h")
      arrange()
      send()
    else if e.which == char("j")
      divide()
      send()

  ).keydown((e) ->

    if e.keyCode == SHIFT
      multi_select = true
    console.log e.keyCode

  ).keyup((e) ->
    multi_select = false

  ).mousedown( ->
    $.each selected, ->
      $(this).removeClass "selected_card"
      $(this).redraw()
    selected = []
  )

  gather()
  selected = []

socket.on('connect', (msg) ->

)

socket.on('message', (msg) ->
  for key of msg
    $(".card[data-id='#{key}']").css("top", msg[key].offset.top)
    .css("left", msg[key].offset.left)
    .css("z-index", msg[key].z_index)
    .data("face",msg[key].face)
    .redraw()

)

socket.on('shuffle', (msg)->
  console.log "shuffle!"

  for key of msg
    to = msg[key].visual.split("-")
    $(".card[data-id='#{key}']").data("suit", to[0])
    .data("num", to[1])
    .redraw()
)

socket.on('init', (msg)->
  $("#loading").fadeOut 500
  $("#back").css("display","block")

  for key of msg
    target = $(".card[data-id='#{key}']")


    if !(msg[key].face is undefined) and !(msg[key].offset is undefined) and !(msg[key].z_index is undefined)
      target.css("top", msg[key].offset.top)
      .css("left", msg[key].offset.left)
      .css("z-index", msg[key].z_index)
      .data("face",msg[key].face)

    if !(msg[key].visual is undefined)
      to = msg[key].visual.split("-")
      target.data("suit", to[0])
      .data("num", to[1])

    target.redraw()

)